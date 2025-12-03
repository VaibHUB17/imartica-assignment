import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Middleware to protect routes that require authentication
export const protect = async (req, res, next) => {
  try {
    let token;

    // Check for token in Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    // Check for token in cookies (if using cookie authentication)
    else if (req.cookies && req.cookies.jwt) {
      token = req.cookies.jwt;
    }

    // If no token found
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Get user from database (excluding password)
      const user = await User.findById(decoded.id).select('-passwordHash -refreshToken');
      
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Token is valid but user no longer exists.'
        });
      }

      // Check if user is active
      if (!user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'User account has been deactivated.'
        });
      }

      // Add user to request object with both id and _id for compatibility
      req.user = {
        ...user.toObject(),
        id: user._id.toString()
      };
      next();

    } catch (jwtError) {
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token has expired. Please login again.',
          code: 'TOKEN_EXPIRED'
        });
      } else if (jwtError.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          message: 'Invalid token. Please login again.',
          code: 'INVALID_TOKEN'
        });
      } else {
        return res.status(401).json({
          success: false,
          message: 'Token verification failed.',
          code: 'TOKEN_VERIFICATION_FAILED'
        });
      }
    }

  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during authentication.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Middleware to restrict access to admin users only
export const adminOnly = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
    }

    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    next();
  } catch (error) {
    console.error('Admin middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during authorization.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Middleware to restrict access to learners only
export const learnerOnly = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
    }

    if (req.user.role !== 'learner') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Learner privileges required.'
      });
    }

    next();
  } catch (error) {
    console.error('Learner middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during authorization.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Middleware to allow both admins and learners but require authentication
export const authenticatedOnly = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
    }

    if (!['admin', 'learner'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Valid user role required.'
      });
    }

    next();
  } catch (error) {
    console.error('Authenticated middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during authorization.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Middleware to check if user owns resource or is admin
export const ownerOrAdmin = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
    }

    // If user is admin, allow access
    if (req.user.role === 'admin') {
      return next();
    }

    // Check if user owns the resource
    // This assumes the resource ID is in req.params.userId or req.user.id
    const resourceUserId = req.params.userId || req.params.learnerId;
    const requestingUserId = req.user._id.toString() || req.user.id;
    
    if (resourceUserId && resourceUserId.toString() === requestingUserId) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: 'Access denied. You can only access your own resources.'
    });

  } catch (error) {
    console.error('Owner or admin middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during authorization.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Optional authentication middleware (doesn't fail if no token)
export const optionalAuth = async (req, res, next) => {
  try {
    let token;

    // Check for token in Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select('-passwordHash -refreshToken');
        
        if (user && user.isActive) {
          req.user = user;
        }
      } catch (jwtError) {
        // Silently ignore token errors for optional auth
        console.log('Optional auth token error:', jwtError.message);
      }
    }

    next();
  } catch (error) {
    console.error('Optional auth middleware error:', error);
    next(); // Continue even if there's an error
  }
};

export default {
  protect,
  adminOnly,
  learnerOnly,
  authenticatedOnly,
  ownerOrAdmin,
  optionalAuth
};