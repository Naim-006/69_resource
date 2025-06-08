const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const User = require('./models/User');
const bcrypt = require('bcryptjs');
const fs = require('fs');

// Load environment variables
dotenv.config();

// Create Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from root directory
app.use(express.static(path.join(__dirname)));

// Dynamically update envconfig.js with values from .env
app.get('/envconfig.js', (req, res) => {
  res.set('Content-Type', 'application/javascript');
  res.send(`
    // Environment Configuration Bridge
    // This file serves as a bridge between backend environment variables and frontend code
    
    // Create a global env object for browser
    window.envConfig = {
      // ImgBB API Configuration
      IMGBB_API_KEY: "${process.env.IMGBB_API_KEY || ''}",
      IMGBB_API_URL: "${process.env.IMGBB_API_URL || ''}",
      
      // Maximum file upload size (10MB)
      MAX_FILE_SIZE: ${10 * 1024 * 1024}
    };
  `);
});

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI, {
  dbName: process.env.DB_NAME,
})
  .then(() => {
    console.log('Connected to MongoDB');
    createAdminUser();
  })
  .catch((err) => {
    console.error('Failed to connect to MongoDB', err);
    process.exit(1);
  });

// Create admin user if it doesn't exist
async function createAdminUser() {
  try {
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;
    
    console.log('Admin credentials from env:', { 
      email: adminEmail, 
      passwordExists: !!adminPassword 
    });
    
    if (!adminEmail || !adminPassword) {
      console.error('Admin credentials not found in environment variables');
      return;
    }
    
    // Check if admin already exists
    const adminExists = await User.findOne({ email: adminEmail });
    console.log('Existing admin found:', !!adminExists);
    
    if (!adminExists) {
      // Create new admin user with direct password (will be hashed by pre-save hook)
      const admin = new User({
        fullName: 'Admin',
        email: adminEmail,
        password: adminPassword, // User model will hash this automatically
        isAdmin: true,
        isVerified: true
      });
      
      await admin.save();
      console.log('Admin user created successfully with email:', adminEmail);
    } else {
      // Set raw password (will be hashed by pre-save hook)
      adminExists.password = adminPassword; // User model will hash this automatically
      adminExists.isAdmin = true;
      adminExists.isVerified = true;
      await adminExists.save();
      console.log('Admin password updated to match environment variable');
    }
  } catch (error) {
    console.error('Error creating/updating admin user:', error);
  }
}

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/resources', require('./routes/resourceRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/user', require('./routes/profileRoutes'));
app.use('/api/user', require('./routes/crRoutes'));
app.use('/api/user/courses', require('./routes/courseRoutes'));

// API 404 handler
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint not found: ${req.originalUrl}`
  });
});

// Default route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'sections/user/dashboard.html'));
});

// Catch-all route to serve index.html for client-side routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'sections/user/dashboard.html'));
});

// Port configuration
const PORT = process.env.PORT || 5000;

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 