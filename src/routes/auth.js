const Joi = require('joi');
const authHandler = require('../handlers/authHandler');

const authRoutes = [
  {
    method: 'POST',
    path: '/api/auth/register',
    handler: authHandler.register,
    options: {
      auth: false,
      description: 'Register new user with phone number and PIN',
      tags: ['api', 'auth'],
      validate: {
        payload: Joi.object({
          phoneNumber: Joi.string()
            .pattern(/^(\+62|62|0)[0-9]{9,12}$/)
            .required()
            .messages({
              'string.pattern.base': 'Phone number must be a valid Indonesian number (e.g., 08123456789 or +628123456789)',
            }),
          pin: Joi.string()
            .length(6)
            .pattern(/^[0-9]+$/)
            .required()
            .messages({
              'string.length': 'PIN must be exactly 6 digits',
              'string.pattern.base': 'PIN must contain only numbers',
            }),
          name: Joi.string().min(3).max(100).optional(),
        }),
      },
    },
  },
  {
    method: 'POST',
    path: '/api/auth/login',
    handler: authHandler.login,
    options: {
      auth: false,
      description: 'User login with phone number and PIN',
      tags: ['api', 'auth'],
      validate: {
        payload: Joi.object({
          phoneNumber: Joi.string()
            .pattern(/^(\+62|62|0)[0-9]{9,12}$/)
            .required()
            .messages({
              'string.pattern.base': 'Phone number must be a valid Indonesian number',
            }),
          pin: Joi.string()
            .length(6)
            .pattern(/^[0-9]+$/)
            .required()
            .messages({
              'string.length': 'PIN must be exactly 6 digits',
              'string.pattern.base': 'PIN must contain only numbers',
            }),
        }),
      },
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
    path: '/api/auth/change-pin',
    handler: authHandler.changePin,
    options: {
      auth: 'jwt',
      description: 'Change user PIN',
      tags: ['api', 'auth'],
      validate: {
        payload: Joi.object({
          oldPin: Joi.string()
            .length(6)
            .pattern(/^[0-9]+$/)
            .required(),
          newPin: Joi.string()
            .length(6)
            .pattern(/^[0-9]+$/)
            .required()
            .invalid(Joi.ref('oldPin'))
            .messages({
              'any.invalid': 'New PIN must be different from old PIN',
            }),
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
      description: 'Check if phone number is available',
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