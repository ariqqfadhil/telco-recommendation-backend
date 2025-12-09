require('dotenv').config();
const mongoose = require('mongoose');

const DB_URI = process.env.DB_URI || 'mongodb://localhost:27017/telco_recommendation';

async function fixIndexes() {
  try {
    console.log('🔧 Fixing database indexes...');
    console.log('');
    
    // Connect to database
    await mongoose.connect(DB_URI);
    console.log('✅ Connected to database');
    
    // Get users collection
    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');
    
    // Get all indexes
    const indexes = await usersCollection.indexes();
    console.log('📋 Current indexes:');
    indexes.forEach(index => {
      console.log(`   - ${JSON.stringify(index.key)}`);
    });
    console.log('');
    
    // Drop email_1 index if exists
    try {
      await usersCollection.dropIndex('email_1');
      console.log('✅ Dropped email_1 index');
    } catch (error) {
      if (error.code === 27) {
        console.log('ℹ️  email_1 index does not exist (already dropped)');
      } else {
        throw error;
      }
    }
    
    console.log('');
    console.log('✅ Index cleanup completed!');
    console.log('');
    console.log('📋 Remaining indexes:');
    const newIndexes = await usersCollection.indexes();
    newIndexes.forEach(index => {
      console.log(`   - ${JSON.stringify(index.key)}`);
    });
    
    console.log('');
    console.log('✅ Now you can run: node seed-data-complete.js');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

fixIndexes();