const express = require('express');
const router = express.Router();
const Resource = require('../models/Resource');
const User = require('../models/User');
const auth = require('../middleware/auth');

// Get all resources with pagination, filtering, and search
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 5, subject = 'all', search = '' } = req.query;
    const skip = (page - 1) * limit;
    
    // Build query
    const query = {};
    
    // Add subject filter if not 'all'
    if (subject !== 'all') {
      query.subject = subject;
    }
    
    // Add search filter if provided
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { authorName: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Execute query with pagination
    const resources = await Resource.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
      
    // Get total count for pagination
    const total = await Resource.countDocuments(query);
    
    res.json({
      resources,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    });
  } catch (error) {
    console.error('Error fetching resources:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get a single resource by ID
router.get('/:id', async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);
    
    if (!resource) {
      return res.status(404).json({ message: 'Resource not found' });
    }
    
    res.json(resource);
  } catch (error) {
    console.error('Error fetching resource:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create a new resource with authentication
router.post('/', auth, async (req, res) => {
  try {
    const { title, link, description, subject } = req.body;
    
    // Get current user from auth middleware
    const userId = req.user.id;
    
    // Find user to get their name
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const resource = new Resource({
      title,
      link,
      description,
      subject,
      author: userId,
      authorName: user.fullName
    });
    
    const savedResource = await resource.save();
    
    res.status(201).json(savedResource);
  } catch (error) {
    console.error('Error creating resource:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update a resource (with auth)
router.put('/:id', auth, async (req, res) => {
  try {
    const { title, link, description, subject } = req.body;
    
    // Find resource to check ownership
    const resource = await Resource.findById(req.params.id);
    if (!resource) {
      return res.status(404).json({ message: 'Resource not found' });
    }
    
    // Check if user is the author or an admin
    if (resource.author.toString() !== req.user.id && !req.user.isAdmin) {
      return res.status(403).json({ message: 'Not authorized to update this resource' });
    }
    
    // Find and update the resource
    const updatedResource = await Resource.findByIdAndUpdate(
      req.params.id,
      { title, link, description, subject },
      { new: true, runValidators: true }
    );
    
    res.json(updatedResource);
  } catch (error) {
    console.error('Error updating resource:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete a resource (with auth)
router.delete('/:id', auth, async (req, res) => {
  try {
    // Find resource to check ownership
    const resource = await Resource.findById(req.params.id);
    if (!resource) {
      return res.status(404).json({ message: 'Resource not found' });
    }
    
    // Check if user is the author or an admin
    if (resource.author.toString() !== req.user.id && !req.user.isAdmin) {
      return res.status(403).json({ message: 'Not authorized to delete this resource' });
    }
    
    const deletedResource = await Resource.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Resource deleted successfully' });
  } catch (error) {
    console.error('Error deleting resource:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router; 