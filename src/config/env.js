// src\config\env.js

require('dotenv').config();

const config = {
  server: {
    host: process.env.HOST || '0.0.0.0', // Important: 0.0.0.0 for Railway
    port: process.env.PORT || 5000,
    env: process.env.NODE_ENV || 'development',
  },
  database: {
    uri: process.env.DB_URI || 'mongodb://localhost:27017/telco_recommendation',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  mlService: {
    url: process.env.ML_SERVICE_URL || 'https://huuddz-telco-hybrid-api.hf.space/recommend',
    timeout: parseInt(process.env.ML_SERVICE_TIMEOUT) || 30000,
  },
  cors: {
    origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : ['*'],
  },
};

module.exports = config;