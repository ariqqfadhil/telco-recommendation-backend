const Joi = require('joi');
const productHandler = require('../handlers/productHandler');
const { checkRole } = require('../middleware/auth');

const productRoutes = [
  {
    method: 'GET',
    path: '/api/products',
    handler: productHandler.getAllProducts,
    options: {
      auth: false,
      description: 'Get all products with pagination and filters',
      tags: ['api', 'products'],
      validate: {
        query: Joi.object({
          page: Joi.number().integer().min(1).default(1),
          limit: Joi.number().integer().min(1).max(100).default(10),
          category: Joi.string().valid('data', 'voice', 'sms', 'combo', 'vod', 'streaming').optional(),
          minPrice: Joi.number().min(0).optional(),
          maxPrice: Joi.number().min(0).optional(),
          search: Joi.string().optional(),
          sortBy: Joi.string().valid('createdAt', 'price', 'name', 'rating.average').default('createdAt'),
          sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
        }),
      },
    },
  },
  {
    method: 'GET',
    path: '/api/products/{id}',
    handler: productHandler.getProductById,
    options: {
      auth: false,
      description: 'Get product by ID',
      tags: ['api', 'products'],
      validate: {
        params: Joi.object({
          id: Joi.string().required(),
        }),
      },
    },
  },
  {
    method: 'GET',
    path: '/api/products/categories/list',
    handler: productHandler.getCategories,
    options: {
      auth: false,
      description: 'Get all product categories',
      tags: ['api', 'products'],
    },
  },
  {
    method: 'GET',
    path: '/api/products/popular/list',
    handler: productHandler.getPopularProducts,
    options: {
      auth: false,
      description: 'Get popular products',
      tags: ['api', 'products'],
      validate: {
        query: Joi.object({
          limit: Joi.number().integer().min(1).max(50).default(10),
        }),
      },
    },
  },
  {
    method: 'POST',
    path: '/api/products',
    handler: productHandler.createProduct,
    options: {
      auth: 'jwt',
      description: 'Create new product (Admin only)',
      tags: ['api', 'products', 'admin'],
      pre: [checkRole(['admin'])],
      validate: {
        payload: Joi.object({
          name: Joi.string().required(),
          category: Joi.string().valid('data', 'voice', 'sms', 'combo', 'vod', 'streaming').required(),
          description: Joi.string().required(),
          price: Joi.number().min(0).required(),
          specifications: Joi.object({
            dataQuota: Joi.number().optional(),
            voiceMinutes: Joi.number().optional(),
            smsCount: Joi.number().optional(),
            validity: Joi.number().optional(),
            speedLimit: Joi.string().optional(),
          }).optional(),
          features: Joi.object({
            hasStreaming: Joi.boolean().optional(),
            hasGaming: Joi.boolean().optional(),
            hasSocialMedia: Joi.boolean().optional(),
            hasRoaming: Joi.boolean().optional(),
            hasHotspot: Joi.boolean().optional(),
          }).optional(),
          imageUrl: Joi.string().uri().optional(),
          provider: Joi.string().default('Telco'),
        }),
      },
    },
  },
  {
    method: 'PUT',
    path: '/api/products/{id}',
    handler: productHandler.updateProduct,
    options: {
      auth: 'jwt',
      description: 'Update product (Admin only)',
      tags: ['api', 'products', 'admin'],
      pre: [checkRole(['admin'])],
      validate: {
        params: Joi.object({
          id: Joi.string().required(),
        }),
        payload: Joi.object({
          name: Joi.string().optional(),
          category: Joi.string().valid('data', 'voice', 'sms', 'combo', 'vod', 'streaming').optional(),
          description: Joi.string().optional(),
          price: Joi.number().min(0).optional(),
          specifications: Joi.object().optional(),
          features: Joi.object().optional(),
          imageUrl: Joi.string().uri().optional(),
          isActive: Joi.boolean().optional(),
        }),
      },
    },
  },
  {
    method: 'DELETE',
    path: '/api/products/{id}',
    handler: productHandler.deleteProduct,
    options: {
      auth: 'jwt',
      description: 'Delete product (Admin only)',
      tags: ['api', 'products', 'admin'],
      pre: [checkRole(['admin'])],
      validate: {
        params: Joi.object({
          id: Joi.string().required(),
        }),
      },
    },
  },
];

module.exports = productRoutes;