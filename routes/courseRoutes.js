const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const isCR = require('../middleware/isCR');
const User = require('../models/User');
const Course = require('../models/Course');

// @route   GET /api/user/courses
// @desc    Get all courses with filters
// @access  Private (auth required)
router.get('/', auth, async (req, res) => {
  try {
    const { search, semester, batch, createdBy, page = 1, limit = 8, include_password = false } = req.query;
    
    // Build query
    const query = {};
    
    // Apply search if provided
    if (search) {
      query.$or = [
        { courseName: { $regex: search, $options: 'i' } },
        { teacherName: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Apply semester filter if provided
    if (semester) {
      query.semester = semester;
    }
    
    // Apply batch filter if provided
    if (batch) {
      query.batch = batch;
    }
    
    // Filter by creator if requested (for CR to see their own courses)
    if (createdBy) {
      query.createdBy = createdBy;
    }
    
    // Calculate pagination
    const pageInt = parseInt(page);
    const limitInt = parseInt(limit);
    const skip = (pageInt - 1) * limitInt;
    
    // Get count for pagination
    const totalCourses = await Course.countDocuments(query);
    const totalPages = Math.ceil(totalCourses / limitInt);
    
    // Fetch courses with pagination
    const courses = await Course.find(query)
      .sort({ createdAt: -1 }) // Newest first
      .skip(skip)
      .limit(limitInt);
    
    // Add isEnrolled field to each course
    const coursesWithEnrollment = courses.map(course => {
      // Check if user is enrolled
      const isEnrolled = course.enrolledStudents.includes(req.user.id);
      
      // Check if the user is the creator of this course
      const isCreator = req.user.isCR && req.user.id.toString() === course.createdBy.toString();
      
      // Convert to plain object
      const courseObj = course.toObject();
      
      // Only include password if the user is the creator AND password is requested
      if (!isCreator || !include_password) {
        delete courseObj.coursePassword;
      }
      
      // Don't send enrolled students list
      delete courseObj.enrolledStudents;
      
      return {
        ...courseObj,
        isEnrolled,
        isCreator
      };
    });
    
    res.json({
      success: true,
      courses: coursesWithEnrollment,
      currentPage: pageInt,
      totalPages,
      totalCourses
    });
    
  } catch (error) {
    console.error('Error getting courses:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/user/courses/filters
// @desc    Get available filter options (semesters, batches)
// @access  Private (auth required)
router.get('/filters', auth, async (req, res) => {
  try {
    // Get unique semesters and batches from courses
    const semesters = await Course.distinct('semester');
    const batches = await Course.distinct('batch');
    
    res.json({
      success: true,
      semesters,
      batches
    });
    
  } catch (error) {
    console.error('Error getting filter options:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/user/courses/:id
// @desc    Get a single course by ID
// @access  Private (auth required)
router.get('/:id', auth, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }
    
    // Check if user is the creator of the course
    const isCreator = req.user.isCR && req.user.id.toString() === course.createdBy.toString();
    
    // Check if user is enrolled
    const isEnrolled = course.enrolledStudents.includes(req.user.id);
    
    // Convert to plain object
    const courseObj = course.toObject();
    
    // Only include password if user is the creator
    if (!isCreator) {
      delete courseObj.coursePassword;
    }
    
    // Don't send enrolled students list
    delete courseObj.enrolledStudents;
    
    res.json({
      success: true,
      course: {
        ...courseObj,
        isEnrolled
      }
    });
    
  } catch (error) {
    console.error('Error getting course:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/user/courses
// @desc    Create a new course
// @access  Private (CR only)
router.post('/', auth, isCR, async (req, res) => {
  try {
    const { courseName, teacherName, coursePassword, thumbnail, section, batch, semester, department } = req.body;
    
    // Validate required fields
    if (!courseName || !teacherName || !coursePassword) {
      return res.status(400).json({
        success: false,
        message: 'Course name, teacher name, and password are required'
      });
    }
    
    // Get user details for CR info
    const user = await User.findById(req.user.id);
    
    // Create a new course
    const newCourse = new Course({
      courseName,
      teacherName,
      coursePassword,
      section: section || user.section,
      batch: batch || user.batch,
      semester: semester || user.semester,
      department: department || 'CSE',
      thumbnail: thumbnail || null,
      createdBy: req.user.id,
      crName: user.fullName,
      crEmail: user.email,
      enrolledStudents: [req.user.id] // Auto-enroll the CR
    });
    
    // Save the course
    await newCourse.save();
    
    // Convert to plain object
    const courseObj = newCourse.toObject();
    
    // Remove sensitive data from response
    delete courseObj.coursePassword;
    delete courseObj.enrolledStudents;
    
    res.status(201).json({
      success: true,
      message: 'Course created successfully',
      course: {
        ...courseObj,
        isEnrolled: true
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

// @route   PUT /api/user/courses/:id
// @desc    Update a course
// @access  Private (CR only, and only the creator)
router.put('/:id', auth, isCR, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }
    
    // Check if user is the creator of the course
    if (req.user.id.toString() !== course.createdBy.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to update this course'
      });
    }
    
    // Update course fields if provided
    const { courseName, teacherName, coursePassword, thumbnail, section, batch, semester, department } = req.body;
    
    if (courseName) course.courseName = courseName;
    if (teacherName) course.teacherName = teacherName;
    if (coursePassword) course.coursePassword = coursePassword;
    if (thumbnail !== undefined) course.thumbnail = thumbnail;
    if (section) course.section = section;
    if (batch) course.batch = batch;
    if (semester) course.semester = semester;
    if (department) course.department = department;
    
    // Save updated course
    await course.save();
    
    // Convert to plain object
    const courseObj = course.toObject();
    
    // Remove sensitive data from response
    delete courseObj.coursePassword;
    delete courseObj.enrolledStudents;
    
    res.json({
      success: true,
      message: 'Course updated successfully',
      course: {
        ...courseObj,
        isEnrolled: true
      }
    });
    
  } catch (error) {
    console.error('Error updating course:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   DELETE /api/user/courses/:id
// @desc    Delete a course
// @access  Private (CR only, and only the creator)
router.delete('/:id', auth, isCR, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }
    
    // Check if user is the creator of the course
    if (req.user.id.toString() !== course.createdBy.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to delete this course'
      });
    }
    
    // Delete course
    await Course.deleteOne({ _id: course._id });
    
    res.json({
      success: true,
      message: 'Course deleted successfully'
    });
    
  } catch (error) {
    console.error('Error deleting course:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/user/courses/:id/enroll
// @desc    Enroll in a course
// @access  Private (auth required)
router.post('/:id/enroll', auth, async (req, res) => {
  try {
    const { password } = req.body;
    
    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Password is required'
      });
    }
    
    const course = await Course.findById(req.params.id);
    
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }
    
    // Check if user is already enrolled
    if (course.enrolledStudents.includes(req.user.id)) {
      return res.status(400).json({
        success: false,
        message: 'You are already enrolled in this course'
      });
    }
    
    // Check password
    if (password !== course.coursePassword) {
      return res.status(400).json({
        success: false,
        message: 'Incorrect password'
      });
    }
    
    // Enroll user
    course.enrolledStudents.push(req.user.id);
    
    // Save course
    await course.save();
    
    res.json({
      success: true,
      message: 'Enrolled successfully'
    });
    
  } catch (error) {
    console.error('Error enrolling in course:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router; 