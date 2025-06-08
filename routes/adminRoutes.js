const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Resource = require('../models/Resource');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');

// Apply auth middleware to all routes
router.use(auth);
router.use(adminAuth);

// Get user statistics for admin dashboard
router.get('/users/stats', async (req, res) => {
  try {
    // Count total users
    const totalUsers = await User.countDocuments();
    
    // Count users who are not admins or CRs (students)
    const studentCount = await User.countDocuments({ isAdmin: false, isCR: false });
    
    // Count CR users
    const crCount = await User.countDocuments({ isCR: true });
    
    res.json({
      totalUsers,
      studentCount,
      crCount
    });
  } catch (error) {
    console.error('Error fetching user statistics:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get resource statistics for admin dashboard
router.get('/resources/stats', async (req, res) => {
  try {
    // Count total resources
    const totalResources = await Resource.countDocuments();
    
    // Count pending resources (assuming there's a status field)
    const pendingResources = await Resource.countDocuments({ status: 'pending' });
    
    // Count approved resources
    const approvedResources = await Resource.countDocuments({ status: 'approved' });
    
    res.json({
      totalResources,
      pendingResources,
      approvedResources
    });
  } catch (error) {
    console.error('Error fetching resource statistics:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get sections data for admin dashboard
router.get('/sections', async (req, res) => {
  try {
    // Get all sections with user counts
    // This is a simplified example - you would need to adapt this to your actual data model
    const sections = [
      { name: '1', studentCount: 35, crCount: 3 },
      { name: '2', studentCount: 42, crCount: 4 },
      { name: '3', studentCount: 33, crCount: 3 }
    ];
    
    // In a real implementation, you might do something like:
    // const sections = await Section.find().select('name').lean();
    // 
    // for (const section of sections) {
    //   section.studentCount = await User.countDocuments({ 
    //     section: section._id, 
    //     isAdmin: false, 
    //     isCR: false 
    //   });
    //   section.crCount = await User.countDocuments({ 
    //     section: section._id, 
    //     isCR: true 
    //   });
    // }
    
    res.json(sections);
  } catch (error) {
    console.error('Error fetching sections:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get dashboard statistics
router.get('/stats', async (req, res) => {
  try {
    // Count total users
    const totalUsers = await User.countDocuments();
    
    // Count verified users
    const verifiedUsers = await User.countDocuments({ isVerified: true });
    
    // Count CRs
    const crCount = await User.countDocuments({ isCR: true });
    
    // Count resources
    const totalResources = await Resource.countDocuments();
    
    // Count pending resources
    const pendingResources = await Resource.countDocuments({ status: 'pending' });
    
    // Count approved resources
    const approvedResources = await Resource.countDocuments({ status: 'approved' });
    
    // Get recent users (last 5)
    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('fullName email isVerified createdAt');
    
    // Get recent resources (last 5)
    const recentResources = await Resource.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('title subject status createdAt');
    
    res.json({
      users: {
        total: totalUsers,
        verified: verifiedUsers,
        cr: crCount
      },
      resources: {
        total: totalResources,
        pending: pendingResources,
        approved: approvedResources
      },
      recentUsers,
      recentResources
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all users with pagination and filtering
router.get('/users', async (req, res) => {
  try {
    const { page = 1, limit = 10, role, search } = req.query;
    const skip = (page - 1) * limit;
    
    // Build query
    const query = {};
    
    // Add role filter
    if (role === 'admin') {
      query.isAdmin = true;
    } else if (role === 'cr') {
      query.isAdmin = false;
      query.isCR = true;
    } else if (role === 'student') {
      query.isAdmin = false;
      query.isCR = false;
    }
    
    // Add search filter
    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Execute query with pagination
    const users = await User.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select('-password');
      
    // Get total count for pagination
    const total = await User.countDocuments(query);
    
    res.json({
      users,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get a single user by ID
router.get('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update user role (make CR or remove CR)
router.put('/users/:id/role', async (req, res) => {
  try {
    const { role } = req.body;
    const userId = req.params.id;
    
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Update user role
    if (role === 'cr') {
      user.isCR = true;
    } else if (role === 'student') {
      user.isCR = false;
    }
    
    await user.save();
    
    res.json({
      message: 'User role updated successfully',
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        isAdmin: user.isAdmin,
        isCR: user.isCR
      }
    });
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update a user
router.put('/users/:id', async (req, res) => {
  try {
    const { isAdmin, isCR, isVerified, section, batch, semester } = req.body;
    
    // Find user
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Update user
    if (typeof isAdmin === 'boolean') user.isAdmin = isAdmin;
    if (typeof isCR === 'boolean') user.isCR = isCR;
    if (typeof isVerified === 'boolean') user.isVerified = isVerified;
    
    // Update section and batch if provided
    if (section !== undefined) user.section = section;
    if (batch !== undefined) user.batch = batch;
    if (semester !== undefined) user.semester = semester;
    
    await user.save();
    
    res.json({
      message: 'User updated successfully',
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        isAdmin: user.isAdmin,
        isCR: user.isCR,
        isVerified: user.isVerified,
        section: user.section,
        batch: user.batch,
        semester: user.semester
      }
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete a user
router.delete('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Prevent deleting self
    if (user._id.toString() === req.user.id) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }
    
    await User.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get emails for multiple users by IDs
router.post('/users/emails', async (req, res) => {
  try {
    const { userIds } = req.body;
    
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ message: 'User IDs are required' });
    }
    
    const users = await User.find({ _id: { $in: userIds } })
      .select('_id email');
    
    res.json(users);
  } catch (error) {
    console.error('Error fetching user emails:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Admin Resource Routes
router.get('/resources', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Build query based on filters
    const query = {};
    
    if (req.query.status && req.query.status !== 'all') {
      query.status = req.query.status;
    }
    
    if (req.query.subject && req.query.subject !== 'all') {
      query.subject = req.query.subject;
    }
    
    if (req.query.search) {
      query.$or = [
        { title: { $regex: req.query.search, $options: 'i' } },
        { description: { $regex: req.query.search, $options: 'i' } }
      ];
    }
    
    // Count total resources
    const totalResources = await Resource.countDocuments(query);
    const totalPages = Math.ceil(totalResources / limit);
    
    // Get resources
    const resources = await Resource.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('author', 'fullName email');
    
    // Add authorEmail field to each resource for easier access
    const resourcesWithEmail = resources.map(resource => {
      const resourceObj = resource.toObject();
      if (resourceObj.author && resourceObj.author.email) {
        resourceObj.authorEmail = resourceObj.author.email;
      }
      return resourceObj;
    });
    
    // Debug: Log what's being sent
    console.log('Sending resources:', resourcesWithEmail);
    
    res.json({
      resources: resourcesWithEmail,
      currentPage: page,
      totalPages,
      totalResources
    });
  } catch (error) {
    console.error('Error fetching resources:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get a single resource
router.get('/resources/:id', async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id)
      .populate('author', 'fullName email');
    
    if (!resource) {
      return res.status(404).json({ message: 'Resource not found' });
    }
    
    // Add authorEmail field for easier access
    const resourceObj = resource.toObject();
    if (resourceObj.author && resourceObj.author.email) {
      resourceObj.authorEmail = resourceObj.author.email;
    }
    
    // Debug: Log what's being sent
    console.log('Sending single resource:', resourceObj);
    
    res.json(resourceObj);
  } catch (error) {
    console.error('Error fetching resource:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update a resource
router.put('/resources/:id', async (req, res) => {
  try {
    const { title, link, description, subject, status } = req.body;
    
    // Find resource
    const resource = await Resource.findById(req.params.id);
    
    if (!resource) {
      return res.status(404).json({ message: 'Resource not found' });
    }
    
    // Update resource
    resource.title = title;
    resource.link = link;
    resource.description = description;
    resource.subject = subject;
    resource.status = status;
    
    await resource.save();
    
    res.json({
      message: 'Resource updated successfully',
      resource
    });
  } catch (error) {
    console.error('Error updating resource:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update resource status
router.patch('/resources/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    
    // Find resource
    const resource = await Resource.findById(req.params.id);
    
    if (!resource) {
      return res.status(404).json({ message: 'Resource not found' });
    }
    
    // Update status
    resource.status = status;
    
    await resource.save();
    
    res.json({
      message: `Resource ${status} successfully`,
      resource
    });
  } catch (error) {
    console.error('Error updating resource status:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete a resource
router.delete('/resources/:id', async (req, res) => {
  try {
    const resource = await Resource.findByIdAndDelete(req.params.id);
    
    if (!resource) {
      return res.status(404).json({ message: 'Resource not found' });
    }
    
    res.json({ message: 'Resource deleted successfully' });
  } catch (error) {
    console.error('Error deleting resource:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router; 