const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

// Create nodemailer transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};

// Register a new user
router.post('/register', async (req, res) => {
  try {
    const { fullName, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already in use' });
    }

    // Create new user
    const user = new User({
      fullName,
      email,
      password
    });

    // Generate verification token
    const verificationToken = user.generateVerificationToken();

    // Save user to database
    await user.save();

    // Create verification URL
    const verificationUrl = `${req.protocol}://${req.get('host')}/auth/verify-email.html?token=${verificationToken}`;

    // Send verification email
    await transporter.sendMail({
      from: `"Study Resource" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: 'Please verify your email',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #3498db;">Welcome to Study Resource!</h2>
          <p>Hi ${user.fullName},</p>
          <p>Thank you for registering. Please verify your email address by clicking the button below:</p>
          <a href="${verificationUrl}" style="display: inline-block; background-color: #3498db; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin: 20px 0;">Verify Email</a>
          <p>If the button doesn't work, you can also click on the link below:</p>
          <p><a href="${verificationUrl}">${verificationUrl}</a></p>
          <p>This link will expire in 24 hours.</p>
          <p>If you did not create an account, please ignore this email.</p>
          <p>Best regards,<br>Study Resource Team</p>
        </div>
      `
    });

    res.status(201).json({
      message: 'Registration successful! Please check your email to verify your account.'
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// Verify email
router.post('/verify-email', async (req, res) => {
  try {
    const { token } = req.body;

    // Hash the token
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    // Find user with the token
    const user = await User.findOne({
      verificationToken: hashedToken,
      verificationTokenExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired verification token' });
    }

    // Update user
    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpires = undefined;
    await user.save();

    res.status(200).json({ message: 'Email verified successfully' });
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({ message: 'Server error during email verification' });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Login attempt for:', email);

    // Check if this is the admin email from env
    const isAdminEmail = email === process.env.ADMIN_EMAIL;
    console.log('Is admin email:', isAdminEmail);
    
    if (isAdminEmail) {
      console.log('Admin login attempt detected');
    }

    // Check if user exists
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      console.log('User not found with email:', email);
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    console.log('User found:', { 
      id: user._id, 
      isAdmin: user.isAdmin,
      isVerified: user.isVerified
    });

    // Check if password is correct
    const isPasswordCorrect = await user.comparePassword(password);
    console.log('Password correct:', isPasswordCorrect);
    
    if (!isPasswordCorrect) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // For admin users, skip email verification check
    if (!user.isAdmin) {
      // Check if email is verified for non-admin users
      if (!user.isVerified) {
        console.log('Email not verified for user:', email);
        return res.status(401).json({ message: 'Please verify your email before logging in' });
      }
    }

    // Update last login
    user.lastLogin = Date.now();
    await user.save({ validateBeforeSave: false });

    // Generate token
    const token = generateToken(user._id);
    console.log('Login successful, token generated');

    // Send response
    res.status(200).json({
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        isAdmin: user.isAdmin,
        isCR: user.isCR
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// Forgot password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Generate reset token
    const resetToken = user.generatePasswordResetToken();
    await user.save({ validateBeforeSave: false });

    // Create reset URL
    const resetUrl = `${req.protocol}://${req.get('host')}/auth/reset-password.html?token=${resetToken}`;

    // Send reset email
    await transporter.sendMail({
      from: `"Study Resource" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: 'Password Reset Request',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #3498db;">Password Reset Request</h2>
          <p>Hi ${user.fullName},</p>
          <p>You requested to reset your password. Please click the button below to reset it:</p>
          <a href="${resetUrl}" style="display: inline-block; background-color: #3498db; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin: 20px 0;">Reset Password</a>
          <p>If the button doesn't work, you can also click on the link below:</p>
          <p><a href="${resetUrl}">${resetUrl}</a></p>
          <p>This link will expire in 10 minutes.</p>
          <p>If you did not request a password reset, please ignore this email.</p>
          <p>Best regards,<br>Study Resource Team</p>
        </div>
      `
    });

    res.status(200).json({ message: 'Password reset email sent' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Server error during password reset request' });
  }
});

// Reset password
router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;

    // Hash the token
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    // Find user with the token
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    // Update user password
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.status(200).json({ message: 'Password reset successful' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Server error during password reset' });
  }
});

module.exports = router; 