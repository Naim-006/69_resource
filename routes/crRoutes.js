const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');
const isCR = require('../middleware/isCR');

// Create a new course - CR only access
// POST /api/user/create-course
router.post('/create-course', auth, isCR, async (req, res) => {
  try {
    console.log('Create course request received:', req.body);
    
    // Destructure data sent from frontend
    const { courseName, teacherName, coursePassword, thumbnail, section, batch, semester, department } = req.body;
    
    // If section, batch, semester are not sent from frontend, use the ones from user
    const courseSection = section || req.user.section;
    const courseBatch = batch || req.user.batch;
    const courseSemester = semester || req.user.semester; 
    const courseDepartment = department || 'CSE'; // Default to CSE if not provided
    
    // Get CR details
    const crName = req.user.fullName;
    const crEmail = req.user.email;
    
    // Ensure CR has section, batch and semester set
    if (!courseSection || !courseBatch || !courseSemester) {
      return res.status(400).json({
        success: false,
        message: 'Please set your section, batch and semester in your profile first'
      });
    }
    
    // Validate required fields
    if (!courseName || !teacherName) {
      return res.status(400).json({
        success: false,
        message: 'Course name and teacher name are required'
      });
    }
    
    // Validate password
    if (!coursePassword || coursePassword.length < 4) {
      return res.status(400).json({
        success: false,
        message: 'Course password must be at least 4 characters'
      });
    }
    
    // Create course logic will go here
    // This is a placeholder for now until we create the Course model
    
    // Log successful creation
    console.log('Course created successfully:', {
      courseName,
      teacherName,
      section: courseSection,
      batch: courseBatch,
      semester: courseSemester,
      department: courseDepartment,
      crName,
      crEmail
    });
    
    res.status(201).json({
      success: true,
      message: 'Course created successfully',
      course: {
        courseName,
        teacherName,
        coursePassword,
        section: courseSection,
        batch: courseBatch,
        semester: courseSemester,
        department: courseDepartment,
        thumbnail: thumbnail || null,
        createdBy: req.user._id,
        crName,
        crEmail
      }
    });
    
  } catch (error) {
    console.error('Error creating course:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router; 