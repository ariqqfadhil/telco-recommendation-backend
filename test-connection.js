require('dotenv').config();
const mongoose = require('mongoose');

const DB_URI = process.env.DB_URI || 'mongodb://localhost:27017/telco_recommendation';

console.log('Testing MongoDB connection...');
console.log('URI:', DB_URI.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@'));

mongoose.connect(DB_URI)
  .then(() => {
    console.log('✅ Connection successful!');
    console.log('Database:', mongoose.connection.name);
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Connection failed:', error.message);
    process.exit(1);
  });