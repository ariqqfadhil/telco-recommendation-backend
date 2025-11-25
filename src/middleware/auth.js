const Boom = require('@hapi/boom');
const { verifyToken } = require('../utils/jwt');
const User = require('../models/User');

/**
 * JWT Authentication Strategy
 */
const jwtAuthStrategy = {
  name: 'jwt',
  scheme: 'jwt',
  options: {
    keys: process.env.JWT_SECRET || 'your-secret-key',
    verify: {
      aud: false,
      iss: false,
      sub: false,
      nbf: true,
      exp: true,
      maxAgeSec: 604800, // 7 days
      timeSkewSec: 15,
    },
    validate: async (artifacts, request, h) => {
      const { payload } = artifacts.decoded;

      // Verify user exists and is active
      const user = await User.findById(payload.userId);
      
      if (!user || !user.isActive) {
        return { isValid: false };
      }

      return {
        isValid: true,
        credentials: {
          userId: user._id,
          email: user.email,
          role: user.role,
          name: user.name,
        },
      };
    },
  },
};

/**
 * Pre-handler for role-based access control
 */
const checkRole = (roles) => {
  return {
    method: (request, h) => {
      const { role } = request.auth.credentials;

      if (!roles.includes(role)) {
        throw Boom.forbidden('You do not have permission to access this resource');
      }

      return h.continue;
    },
    assign: 'roleCheck',
  };
};

/**
 * Optional authentication (allows both authenticated and guest users)
 */
const optionalAuth = {
  mode: 'optional',
  strategy: 'jwt',
};

module.exports = {
  jwtAuthStrategy,
  checkRole,
  optionalAuth,
};