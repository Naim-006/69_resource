const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');
const bcrypt = require('bcryptjs');

// @route   GET /api/user/profile
// @desc    Get current user profile
// @access  Private
router.get('/profile', auth, async (req, res) => {
  try {
    // Find user by id (from auth middleware)
    const user = await User.findById(req.user.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    res.json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Error in GET /profile:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   PUT /api/user/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', auth, async (req, res) => {
  try {
    const { fullName, batch, section, semester } = req.body;
    
    // Build profile object
    const profileFields = {};
    if (fullName) profileFields.fullName = fullName;
    
    // Check if user is a CR
    if (req.user.isCR) {
      // CR users cannot change their batch, section, or semester
      if ((batch && batch !== req.user.batch) || 
          (section && section !== req.user.section) || 
          (semester && semester !== req.user.semester)) {
        return res.status(403).json({ 
          success: false, 
          message: 'Class Representatives cannot change their batch, section, or semester' 
        });
      }
    }
    
    // Only add these fields for non-CR users or if they remain unchanged
    if (batch) profileFields.batch = batch;
    if (section) profileFields.section = section;
    if (semester) profileFields.semester = semester;
    
    // Update user
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: profileFields },
      { new: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    res.json({
      success: true,
      message: 'Profile updated successfully',
      user
    });
  } catch (error) {
    console.error('Error in PUT /profile:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   PUT /api/user/change-password
// @desc    Change user password
// @access  Private
router.put('/change-password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    // Validate input
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ 
        success: false, 
        message: 'Current password and new password are required' 
      });
    }
    
    // Get user with password
    const user = await User.findById(req.user.id).select('+password');
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    // Check if current password is correct
    const isMatch = await user.comparePassword(currentPassword);
    
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    }
    
    // Set new password
    user.password = newPassword;
    
    // Save user with new password (will be hashed by model pre-save hook)
    await user.save();
    
    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Error in PUT /change-password:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router; 