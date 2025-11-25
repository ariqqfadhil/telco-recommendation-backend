const Joi = require('joi');
const authHandler = require('../handlers/authHandler');

const authRoutes = [
  {
    method: 'POST',
    path: '/api/auth/register',
    handler: authHandler.register,
    options: {
      auth: false,
      description: 'Register new user',
      tags: ['api', 'auth'],
      validate: {
        payload: Joi.object({
          name: Joi.string().min(3).max(100).required(),
          email: Joi.string().email().required(),
          password: Joi.string().min(6).required(),
          phoneNumber: Joi.string().optional(),
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
      description: 'User login',
      tags: ['api', 'auth'],
      validate: {
        payload: Joi.object({
          email: Joi.string().email().required(),
          password: Joi.string().required(),
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
          phoneNumber: Joi.string().optional(),
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
    path: '/api/auth/change-password',
    handler: authHandler.changePassword,
    options: {
      auth: 'jwt',
      description: 'Change user password',
      tags: ['api', 'auth'],
      validate: {
        payload: Joi.object({
          oldPassword: Joi.string().required(),
          newPassword: Joi.string().min(6).required(),
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