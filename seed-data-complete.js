require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');
const Product = require('./src/models/Product');

// Sample Users (No PIN needed - will use OTP)
const users = [
  {
    phoneNumber: '081234567890',
    name: 'Admin User',
    role: 'admin',
    isVerified: true,
    preferences: {
      usageType: 'mixed',
      budget: 'high',
      interests: ['streaming', 'gaming'],
    },
  },
  {
    phoneNumber: '081234567891',
    name: 'Test User',
    role: 'user',
    isVerified: true,
    preferences: {
      usageType: 'data',
      budget: 'medium',
      interests: ['streaming', 'social-media'],
    },
  },
  {
    phoneNumber: '081234567892',
    name: 'Heavy Data User',
    role: 'user',
    isVerified: true,
    preferences: {
      usageType: 'data',
      budget: 'high',
      interests: ['streaming', 'gaming'],
    },
  },
];

// Sample Products Aligned with ML Target Offers
const products = [
  // ========== DATA BOOSTER ==========
  {
    name: 'Data Booster 10GB',
    category: 'data',
    description: 'Boost your data quota with extra 10GB high-speed internet',
    price: 50000,
    specifications: {
      dataQuota: 10240,
      validity: 30,
    },
    targetOffer: 'Data Booster',
  },
  {
    name: 'Data Booster 25GB',
    category: 'data',
    description: 'Extra 25GB data for heavy users',
    price: 100000,
    specifications: {
      dataQuota: 25600,
      validity: 30,
    },
    targetOffer: 'Data Booster',
  },

  // ========== VOICE BUNDLE ==========
  {
    name: 'Voice Bundle Unlimited',
    category: 'voice',
    description: 'Unlimited calls to all operators',
    price: 50000,
    specifications: {
      voiceMinutes: 999999,
      validity: 30,
    },
    targetOffer: 'Voice Bundle',
  },
  {
    name: 'Voice Bundle 300 Minutes',
    category: 'voice',
    description: '300 minutes calls to all operators',
    price: 30000,
    specifications: {
      voiceMinutes: 300,
      validity: 30,
    },
    targetOffer: 'Voice Bundle',
  },

  // ========== ROAMING PASS ==========
  {
    name: 'ASEAN Roaming Pass',
    category: 'roaming',
    description: 'Stay connected across ASEAN countries',
    price: 75000,
    specifications: {
      roaming: {
        isAvailable: true,
        countries: ['Singapore', 'Malaysia', 'Thailand', 'Vietnam', 'Philippines'],
        dataQuota: 2048,
        voiceMinutes: 60,
      },
      validity: 7,
    },
    targetOffer: 'Roaming Pass',
  },

  // ========== STREAMING PARTNER PACK ==========
  {
    name: 'Netflix Premium Package',
    category: 'streaming',
    description: 'Netflix Premium + 15GB streaming data',
    price: 120000,
    specifications: {
      dataQuota: 15360,
      videoDataQuota: 15360,
      validity: 30,
    },
    targetOffer: 'Streaming Partner Pack',
  },
  {
    name: 'YouTube Premium Pack',
    category: 'streaming',
    description: 'YouTube Premium + unlimited YouTube streaming',
    price: 85000,
    specifications: {
      dataQuota: 999999,
      videoDataQuota: 999999,
      validity: 30,
    },
    targetOffer: 'Streaming Partner Pack',
  },

  // ========== FAMILY PLAN OFFER ==========
  {
    name: 'Family Plan 50GB',
    category: 'combo',
    description: 'Share 50GB data + unlimited calls for family',
    price: 200000,
    specifications: {
      dataQuota: 51200,
      voiceMinutes: 999999,
      smsCount: 500,
      validity: 30,
    },
    targetOffer: 'Family Plan Offer',
  },

  // ========== GENERAL OFFER ==========
  {
    name: 'Combo Hemat',
    category: 'combo',
    description: 'Best value combo package for everyday use',
    price: 85000,
    specifications: {
      dataQuota: 15360,
      voiceMinutes: 100,
      smsCount: 100,
      validity: 30,
    },
    targetOffer: 'General Offer',
  },
  {
    name: 'Unlimited Everything',
    category: 'combo',
    description: 'Unlimited data, voice, and SMS',
    price: 300000,
    specifications: {
      dataQuota: 999999,
      voiceMinutes: 999999,
      smsCount: 999999,
      validity: 30,
    },
    targetOffer: 'General Offer',
  },
];

async function seedData() {
  try {
    console.log('🌱 Starting database seeding with OTP authentication...');
    console.log('');

    // Connect to database
    await mongoose.connect(process.env.DB_URI);
    console.log('✅ Connected to database');
    console.log('');

    // Clear existing data
    console.log('🗑️  Clearing existing data...');
    await User.deleteMany({});
    await Product.deleteMany({});
    console.log('✅ Existing data cleared');
    console.log('');

    // Insert users
    console.log('👤 Seeding users...');
    const insertedUsers = await User.insertMany(users);
    console.log(`✅ Inserted ${insertedUsers.length} users`);
    console.log('');
    console.log('📋 Test Accounts (Use OTP for login):');
    insertedUsers.forEach(user => {
      console.log(`   - ${user.phoneNumber} (${user.role}) - ${user.name}`);
      console.log(`     → Use OTP authentication to login`);
    });
    console.log('');

    // Insert products
    console.log('📦 Seeding products...');
    const insertedProducts = await Product.insertMany(products);
    console.log(`✅ Inserted ${insertedProducts.length} products`);
    console.log('');

    // Count by targetOffer
    const targetCount = await Product.aggregate([
      { $group: { _id: '$targetOffer', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    console.log('📊 Products by target offer:');
    targetCount.forEach(item => {
      console.log(`   - ${item._id}: ${item.count} products`);
    });
    console.log('');

    console.log('═══════════════════════════════════════════════════');
    console.log('🎉 Database seeding completed successfully!');
    console.log('═══════════════════════════════════════════════════');
    console.log('');
    console.log('🔐 AUTHENTICATION FLOW:');
    console.log('   1. POST /api/auth/request-otp');
    console.log('      { "phoneNumber": "081234567890" }');
    console.log('   2. Check console for OTP code');
    console.log('   3. POST /api/auth/verify-otp');
    console.log('      { "phoneNumber": "081234567890", "otp": "123456" }');
    console.log('');
    console.log('💡 Note: OTP codes will be printed in console');
    console.log('   (In production, integrate SMS gateway)');
    console.log('═══════════════════════════════════════════════════');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    console.error(error.stack);
    process.exit(1);
  }
}

seedData();