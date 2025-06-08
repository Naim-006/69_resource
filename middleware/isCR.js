// Middleware to check if the user is a CR
module.exports = (req, res, next) => {
  try {
    // Check if user exists in request (should be set by auth middleware)
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized access'
      });
    }
    
    // Check if user is a CR
    if (!req.user.isCR) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only Class Representatives (CR) can access this resource'
      });
    }
    
    // User is a CR, proceed to the next middleware/route handler
    next();
    
  } catch (error) {
    console.error('Error in isCR middleware:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
}; 