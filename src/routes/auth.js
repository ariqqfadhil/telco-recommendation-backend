const Joi = require('joi');
const authHandler = require('../handlers/authHandler');

const authRoutes = [
  {
    method: 'POST',
    path: '/api/auth/request-otp',
    handler: authHandler.requestOTP,
    options: {
      auth: false,
      description: 'Request OTP for login/register',
      tags: ['api', 'auth'],
      validate: {
        payload: Joi.object({
          phoneNumber: Joi.string()
            .pattern(/^(\+62|62|0)[0-9]{9,12}$/)
            .required()
            .messages({
              'string.pattern.base': 'Phone number must be a valid Indonesian number (e.g., 08123456789 or +628123456789)',
            }),
          name: Joi.string().min(3).max(100).optional(),
        }),
      },
    },
  },
  {
    method: 'POST',
    path: '/api/auth/verify-otp',
    handler: authHandler.verifyOTP,
    options: {
      auth: false,
      description: 'Verify OTP and login',
      tags: ['api', 'auth'],
      validate: {
        payload: Joi.object({
          phoneNumber: Joi.string()
            .pattern(/^(\+62|62|0)[0-9]{9,12}$/)
            .required()
            .messages({
              'string.pattern.base': 'Phone number must be a valid Indonesian number',
            }),
          otp: Joi.string()
            .length(6)
            .pattern(/^[0-9]+$/)
            .required()
            .messages({
              'string.length': 'OTP must be exactly 6 digits',
              'string.pattern.base': 'OTP must contain only numbers',
            }),
        }),
      },
    },
  },
  {
    method: 'GET',
    path: '/api/auth/otp-config',
    handler: authHandler.getOTPConfig,
    options: {
      auth: false,
      description: 'Get OTP configuration',
      tags: ['api', 'auth'],
    },
  },
  {
    method: 'GET',
    path: '/api/auth/profile',
    handler: authHandler.getProfile,
    options: {
      auth: 'jwt',
      description: 'Get user profile',
      tags: ['api', 'auth'],
    },
  },
  {
    method: 'PUT',
    path: '/api/auth/profile',
    handler: authHandler.updateProfile,
    options: {
      auth: 'jwt',
      description: 'Update user profile',
      tags: ['api', 'auth'],
      validate: {
        payload: Joi.object({
          name: Joi.string().min(3).max(100).optional(),
          profilePicture: Joi.string().uri().optional(),
          preferences: Joi.object({
            usageType: Joi.string().valid('data', 'voice', 'sms', 'mixed').optional(),
            budget: Joi.string().valid('low', 'medium', 'high').optional(),
            interests: Joi.array().items(
              Joi.string().valid('streaming', 'gaming', 'social-media', 'work', 'browsing')
            ).optional(),
          }).optional(),
        }),
      },
    },
  },
  {
    method: 'POST',
    path: '/api/auth/check-phone',
    handler: authHandler.checkPhoneAvailability,
    options: {
      auth: false,
      description: 'Check if phone number exists',
      tags: ['api', 'auth'],
      validate: {
        payload: Joi.object({
          phoneNumber: Joi.string()
            .pattern(/^(\+62|62|0)[0-9]{9,12}$/)
            .required(),
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
    },
  },
];

module.exports = authRoutes;