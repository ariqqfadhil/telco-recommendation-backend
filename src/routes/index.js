const authRoutes = require('./auth');
const productRoutes = require('./products');
const recommendationRoutes = require('./recommendations');

// Health check route
const healthRoute = {
  method: 'GET',
  path: '/',
  handler: (request, h) => {
    return h.response({
      status: 'success',
      message: 'Telco Recommendation API is running',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    }).code(200);
  },
  options: {
    auth: false,
    description: 'API health check',
    tags: ['api', 'health'],
  },
};

// API info route
const apiInfoRoute = {
  method: 'GET',
  path: '/api',
  handler: (request, h) => {
    return h.response({
      status: 'success',
      message: 'Telco Product Recommendation System API',
      version: '1.0.0',
      endpoints: {
        auth: '/api/auth',
        products: '/api/products',
        recommendations: '/api/recommendations',
      },
      documentation: '/documentation',
    }).code(200);
  },
  options: {
    auth: false,
    description: 'API information',
    tags: ['api', 'info'],
  },
};

// Combine all routes
const routes = [
  healthRoute,
  apiInfoRoute,
  ...authRoutes,
  ...productRoutes,
  ...recommendationRoutes,
];

module.exports = routes;