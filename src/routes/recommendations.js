const Joi = require('joi');
const recommendationHandler = require('../handlers/recommendationHandler');
const { checkRole } = require('../middleware/auth');

const recommendationRoutes = [
  {
    method: 'GET',
    path: '/api/recommendations',
    handler: recommendationHandler.getRecommendations,
    options: {
      auth: 'jwt',
      description: 'Get personalized product recommendations',
      tags: ['api', 'recommendations'],
      validate: {
        query: Joi.object({
          algorithm: Joi.string().valid('collaborative', 'content-based', 'hybrid').default('hybrid'),
          limit: Joi.number().integer().min(1).max(20).default(5),
        }),
      },
    },
  },
  {
    method: 'GET',
    path: '/api/recommendations/history',
    handler: recommendationHandler.getRecommendationHistory,
    options: {
      auth: 'jwt',
      description: 'Get recommendation history',
      tags: ['api', 'recommendations'],
      validate: {
        query: Joi.object({
          page: Joi.number().integer().min(1).default(1),
          limit: Joi.number().integer().min(1).max(50).default(10),
        }),
      },
    },
  },
  {
    method: 'POST',
    path: '/api/recommendations/{id}/interaction',
    handler: recommendationHandler.trackInteraction,
    options: {
      auth: 'jwt',
      description: 'Track user interaction with recommendation',
      tags: ['api', 'recommendations'],
      validate: {
        params: Joi.object({
          id: Joi.string().required(),
        }),
        payload: Joi.object({
          productId: Joi.string().required(),
          action: Joi.string().valid('viewed', 'clicked', 'purchased', 'ignored').required(),
        }),
      },
    },
  },
  {
    method: 'GET',
    path: '/api/recommendations/stats',
    handler: recommendationHandler.getStats,
    options: {
      auth: 'jwt',
      description: 'Get recommendation statistics (Admin only)',
      tags: ['api', 'recommendations', 'admin'],
      pre: [checkRole(['admin'])],
    },
  },
  {
    method: 'POST',
    path: '/api/recommendations/feedback',
    handler: recommendationHandler.submitFeedback,
    options: {
      auth: 'jwt',
      description: 'Submit feedback on recommendation',
      tags: ['api', 'recommendations'],
      validate: {
        payload: Joi.object({
          recommendationId: Joi.string().required(),
          rating: Joi.number().min(1).max(5).required(),
          comment: Joi.string().optional(),
        }),
      },
    },
  },
];

module.exports = recommendationRoutes;