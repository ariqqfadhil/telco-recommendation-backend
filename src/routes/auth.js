const Joi = require('joi');
const authHandler = require('../handlers/authHandler');
const { checkRole } = require('../middleware/auth');

/**
 * Simple Authentication Routes
 * No PIN, No OTP - Just phone number based login
 */
const authRoutes = [
  // ==================== SIMPLE LOGIN ====================
  {
    method: 'POST',
    path: '/api/auth/login',
    handler: authHandler.simpleLogin,
    options: {
      auth: false,
      description: 'Simple login with phone number only',
      tags: ['api', 'auth'],
      notes: [
        'Login dengan nomor telepon saja',
        'Jika user belum terdaftar, otomatis register',
        'Tidak perlu PIN atau OTP',
        'Returns JWT token valid for 7 days'
      ],
      validate: {
        payload: Joi.object({
          phoneNumber: Joi.string()
            .pattern(/^(\+62|62|0)[0-9]{9,12}$/)
            .required()
            .messages({
              'string.pattern.base': 'Phone number must be valid Indonesian number (e.g., 08123456789)',
              'any.required': 'Phone number is required',
            })
            .description('Indonesian phone number (08xxx, 62xxx, or +62xxx)'),
          name: Joi.string()
            .min(3)
            .max(100)
            .optional()
            .description('Name (optional, auto-generated if empty)'),
        }).description('Login request payload'),
      },
    },
  },

  // ==================== PROFILE ENDPOINTS ====================
  {
    method: 'GET',
    path: '/api/auth/profile',
    handler: authHandler.getProfile,
    options: {
      auth: 'jwt',
      description: 'Get user profile',
      tags: ['api', 'auth', 'profile'],
      notes: [
        'Requires JWT token in Authorization header',
        'Returns complete user profile including preferences'
      ],
    },
  },
  {
    method: 'PUT',
    path: '/api/auth/profile',
    handler: authHandler.updateProfile,
    options: {
      auth: 'jwt',
      description: 'Update user profile',
      tags: ['api', 'auth', 'profile'],
      notes: [
        'Update name, preferences, or profile picture',
        'All fields are optional',
        'Requires JWT token'
      ],
      validate: {
        payload: Joi.object({
          name: Joi.string()
            .min(3)
            .max(100)
            .optional()
            .description('User name'),
          profilePicture: Joi.string()
            .uri()
            .optional()
            .description('Profile picture URL'),
          preferences: Joi.object({
            usageType: Joi.string()
              .valid('data', 'voice', 'sms', 'mixed')
              .optional()
              .description('Primary usage type'),
            budget: Joi.string()
              .valid('low', 'medium', 'high')
              .optional()
              .description('Budget range'),
            interests: Joi.array()
              .items(
                Joi.string().valid('streaming', 'gaming', 'social-media', 'work', 'browsing')
              )
              .optional()
              .description('User interests for recommendations'),
          }).optional().description('User preferences for ML recommendations'),
        }).description('Profile update payload'),
      },
    },
  },

  // ==================== UTILITY ENDPOINTS ====================
  {
    method: 'POST',
    path: '/api/auth/check-phone',
    handler: authHandler.checkPhoneAvailability,
    options: {
      auth: false,
      description: 'Check if phone number is registered',
      tags: ['api', 'auth', 'utility'],
      notes: [
        'Check if phone number exists in database',
        'Returns user name if exists',
        'No authentication required'
      ],
      validate: {
        payload: Joi.object({
          phoneNumber: Joi.string()
            .pattern(/^(\+62|62|0)[0-9]{9,12}$/)
            .required()
            .description('Phone number to check'),
        }),
      },
    },
  },
  {
    method: 'POST',
    path: '/api/auth/logout',
    handler: authHandler.logout,
    options: {
      auth: 'jwt',
      description: 'User logout',
      tags: ['api', 'auth'],
      notes: [
        'Logout is handled client-side by removing JWT token',
        'This endpoint just logs the logout action',
        'Remove token from localStorage/sessionStorage after calling this'
      ],
    },
  },

  // ==================== ADMIN ENDPOINTS ====================
  {
    method: 'GET',
    path: '/api/auth/users',
    handler: authHandler.getAllUsers,
    options: {
      auth: 'jwt',
      description: 'Get all users (Admin only)',
      tags: ['api', 'auth', 'admin'],
      notes: [
        'Requires admin role',
        'Returns paginated list of users',
        'Includes user statistics and last login'
      ],
      pre: [checkRole(['admin'])],
      validate: {
        query: Joi.object({
          page: Joi.number()
            .integer()
            .min(1)
            .default(1)
            .description('Page number'),
          limit: Joi.number()
            .integer()
            .min(1)
            .max(100)
            .default(20)
            .description('Items per page (max 100)'),
        }),
      },
    },
  },
  {
    method: 'DELETE',
    path: '/api/auth/users/{id}',
    handler: authHandler.deleteUser,
    options: {
      auth: 'jwt',
      description: 'Deactivate user (Admin only)',
      tags: ['api', 'auth', 'admin'],
      notes: [
        'Soft delete (sets isActive to false)',
        'User can no longer login',
        'Data is preserved for analytics'
      ],
      pre: [checkRole(['admin'])],
      validate: {
        params: Joi.object({
          id: Joi.string()
            .required()
            .description('User ID to deactivate'),
        }),
      },
    },
  },
];

module.exports = authRoutes;