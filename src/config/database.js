// src\config\database.js

const mongoose = require('mongoose');
const config = require('./env');

const connectDatabase = async () => {
  try {
    // Connection options
    const options = {
      serverSelectionTimeoutMS: 10000, // Timeout 10 detik
      socketTimeoutMS: 45000,
    };

    console.log('🔄 Connecting to database...');
    console.log('📍 Database URI:', config.database.uri.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@')); // Hide password in log
    
    await mongoose.connect(config.database.uri, options);
    
    console.log('✅ Database connected successfully');
    console.log('📦 Database name:', mongoose.connection.name);
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.error('');
    console.error('💡 Troubleshooting tips:');
    console.error('   1. Check if MongoDB is running (local) or accessible (Atlas)');
    console.error('   2. Verify DB_URI in .env file');
    console.error('   3. For Atlas: Check Network Access whitelist (0.0.0.0/0)');
    console.error('   4. For Atlas: Verify database user credentials');
    console.error('   5. Check your internet connection');
    console.error('');
    process.exit(1);
  }
};

// Handle connection events
mongoose.connection.on('connected', () => {
  console.log('📦 Mongoose connected to database');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('📦 Mongoose disconnected');
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('👋 Mongoose connection closed due to app termination');
  process.exit(0);
});

module.exports = connectDatabase;