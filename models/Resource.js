const mongoose = require('mongoose');

const resourceSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Resource title is required'],
    trim: true
  },
  link: {
    type: String,
    required: [true, 'Resource link is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  subject: {
    type: String,
    required: [true, 'Subject is required'],
    enum: ['computer', 'math', 'physics', 'chemistry', 'english', 'accounting', 'statistic', 'others']
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Author information is required']
  },
  authorName: {
    type: String,
    required: [true, 'Author name is required']
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'approved'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Create indexes for better search performance
resourceSchema.index({ title: 'text', description: 'text' });

const Resource = mongoose.model('Resource', resourceSchema);

module.exports = Resource; 