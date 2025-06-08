const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const UserSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: [true, 'Please provide your full name'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Please provide your email'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
      'Please provide a valid email'
    ]
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 8,
    select: false
  },
  section: {
    type: String,
    default: null
  },
  batch: {
    type: String,
    default: null
  },
  semester: {
    type: String,
    default: null
  },
  isAdmin: {
    type: Boolean,
    default: false
  },
  isCR: {
    type: Boolean,
    default: false
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  isApproved: {
    type: Boolean,
    default: false
  },
  verificationToken: String,
  verificationTokenExpires: Date,
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastLogin: Date
});

// Encrypt password before saving
UserSchema.pre('save', async function(next) {
  // Only run this if password was modified
  if (!this.isModified('password')) return next();
  
  // Hash the password
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare entered password with hashed password
UserSchema.methods.comparePassword = async function(enteredPassword) {
  try {
    console.log('Comparing passwords for user:', this.email);
    const isMatch = await bcrypt.compare(enteredPassword, this.password);
    console.log('Password match result:', isMatch);
    return isMatch;
  } catch (error) {
    console.error('Error comparing passwords:', error);
    return false;
  }
};

// Generate verification token
UserSchema.methods.generateVerificationToken = function() {
  // Generate token
  const verificationToken = crypto.randomBytes(32).toString('hex');
  
  // Hash token and set to verificationToken field
  this.verificationToken = crypto
    .createHash('sha256')
    .update(verificationToken)
    .digest('hex');
  
  // Set token expiry (24 hours)
  this.verificationTokenExpires = Date.now() + 24 * 60 * 60 * 1000;
  
  return verificationToken;
};

// Generate password reset token
UserSchema.methods.generatePasswordResetToken = function() {
  // Generate token
  const resetToken = crypto.randomBytes(32).toString('hex');
  
  // Hash token and set to resetPasswordToken field
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  
  // Set token expiry (10 minutes)
  this.resetPasswordExpires = Date.now() + 10 * 60 * 1000;
  
  return resetToken;
};

module.exports = mongoose.model('User', UserSchema); 