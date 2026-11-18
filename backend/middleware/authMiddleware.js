// backend/middleware/authMiddleware.js
// JWT verification middleware. Verifies tokens and attaches the user context.
const jwt = require('jsonwebtoken');
const asyncHandler = require('../utils/asyncHandler');
const { error: sendError } = require('../utils/response');
const User = require('../models/User');

const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return sendError(res, 401, 'Not authorized, no token provided');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded?.id) {
      return sendError(res, 401, 'Not authorized, token failed');
    }

    // ENV admin is authenticated by its signed JWT and has no MongoDB record.
    if (decoded.id === 'env-admin' && decoded.role === 'admin') {
      req.user = {
        id: 'env-admin',
        name: 'Admin',
        email: decoded.email || String(process.env.ADMIN_EMAIL || '').trim().toLowerCase(),
        role: 'admin',
      };
      return next();
    }

    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return sendError(res, 401, 'Not authorized, user not found');
    }

    req.user = user;
    next();
  } catch (err) {
    return sendError(res, 401, 'Not authorized, token failed');
  }
});

module.exports = { protect };
