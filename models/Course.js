const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  courseName: {
    type: String,
    required: [true, 'Course name is required'],
    trim: true
  },
  teacherName: {
    type: String,
    required: [true, 'Teacher name is required'],
    trim: true
  },
  section: {
    type: String,
    required: [true, 'Section is required'],
    trim: true
  },
  batch: {
    type: String, 
    required: [true, 'Batch is required'],
    trim: true
  },
  semester: {
    type: String,
    required: [true, 'Semester is required'],
    trim: true
  },
  department: {
    type: String,
    default: 'CSE',
    trim: true
  },
  thumbnail: {
    type: String,
    default: null
  },
  coursePassword: {
    type: String,
    required: [true, 'Course password is required'],
    minlength: 4
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Creator information is required']
  },
  crName: {
    type: String,
    required: [true, 'CR name is required']
  },
  crEmail: {
    type: String,
    required: [true, 'CR email is required']
  },
  enrolledStudents: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Create indexes for better search performance
courseSchema.index({ courseName: 'text', teacherName: 'text' });

const Course = mongoose.model('Course', courseSchema);

module.exports = Course; 