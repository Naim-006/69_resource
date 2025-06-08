const User = require('../models/User');

// Admin authorization middleware
const adminAuth = async (req, res, next) => {
  try {
    // Check if user exists in request (set by auth middleware)
    if (!req.user) {
      return res.status(401).json({ message: 'Not authorized, no token' });
    }
    
    // Check if user is admin
    const user = await User.findById(req.user.id);
    
    if (!user || !user.isAdmin) {
      return res.status(403).json({ message: 'Not authorized as an admin' });
    }
    
    next();
  } catch (error) {
    console.error('Admin auth error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = adminAuth; 