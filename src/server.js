const Hapi = require('@hapi/hapi');
const Jwt = require('@hapi/jwt');
const Inert = require('@hapi/inert');
const Vision = require('@hapi/vision');
const Boom = require('@hapi/boom');
const Path = require('path');

const config = require('./config/env');
const connectDatabase = require('./config/database');
const routes = require('./routes');

const init = async () => {
  // Create Hapi server
  const server = Hapi.server({
    port: config.server.port,
    host: config.server.host,
    routes: {
      cors: {
        origin: config.cors.origin,
        credentials: true,
      },
      validate: {
        failAction: async (request, h, err) => {
          if (config.server.env === 'production') {
            console.error('Validation error:', err);
            throw Boom.badRequest('Invalid request payload input');
          } else {
            throw err;
          }
        },
      },
      files: {
        relativeTo: Path.join(__dirname, '../public')
      },
    },
  });

  // Register plugins
  await server.register([
    Jwt,
    Inert,
    Vision,
  ]);

  // Setup JWT authentication strategy
  server.auth.strategy('jwt', 'jwt', {
    keys: config.jwt.secret,
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
      const User = require('./models/User');
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
          phoneNumber: user.phoneNumber,
          role: user.role,
          name: user.name,
        },
      };
    },
  });

  // Set default auth strategy
  server.auth.default('jwt');

  // Serve API Documentation
  server.route({
    method: 'GET',
    path: '/docs',
    handler: (request, h) => {
      return h.file('api-docs.html');
    },
    options: {
      auth: false,
      description: 'API Documentation',
    }
  });

  // Serve static files from public folder
  server.route({
    method: 'GET',
    path: '/public/{param*}',
    handler: {
      directory: {
        path: '.',
        redirectToSlash: true,
      }
    },
    options: {
      auth: false,
    }
  });

  // Register routes
  server.route(routes);

  // Error handling extension
  server.ext('onPreResponse', (request, h) => {
    const { response } = request;

    // Handle Boom errors
    if (response.isBoom) {
      const error = response;
      const statusCode = error.output.statusCode;
      const errorResponse = {
        status: 'error',
        message: error.message,
        statusCode,
      };

      // Add validation details if exists
      if (error.data) {
        errorResponse.validation = error.data;
      }

      console.error(`[${statusCode}] ${error.message}`);

      return h.response(errorResponse).code(statusCode);
    }

    return h.continue;
  });

  // Add request logging in development
  if (config.server.env === 'development') {
    server.events.on('response', (request) => {
      const { method, path } = request;
      const statusCode = request.response.statusCode;
      const responseTime = Date.now() - request.info.received;
      
      console.log(`[${method.toUpperCase()}] ${path} - ${statusCode} (${responseTime}ms)`);
    });
  }

  // Connect to database
  await connectDatabase();

  // Start server
  await server.start();
  
  console.log('');
  console.log('🚀 ========================================');
  console.log('   Telco Recommendation API Server');
  console.log('   ========================================');
  console.log(`   🌐 Server: ${server.info.uri}`);
  console.log(`   📦 Environment: ${config.server.env}`);
  console.log(`   🔐 JWT Auth: Enabled`);
  console.log(`   📊 Database: Connected`);
  console.log('   ========================================');
  console.log('');
  console.log('   📖 API Endpoints:');
  console.log('   - Health: GET /');
  console.log('   - Docs: GET /docs');
  console.log('   - Auth: /api/auth/*');
  console.log('   - Products: /api/products/*');
  console.log('   - Recommendations: /api/recommendations/*');
  console.log('');
  console.log('   ⚠️  ML Model: Using MOCK data (model not deployed yet)');
  console.log('');
  console.log('   Press CTRL+C to stop');
  console.log('========================================');
  console.log('');

  return server;
};

// Handle unhandled rejection
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled rejection:', err);
  process.exit(1);
});

// Handle SIGTERM
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM signal received: closing HTTP server');
  process.exit(0);
});

// Start server
init().catch((err) => {
  console.error('❌ Server initialization failed:', err);
  process.exit(1);
});

module.exports = init;