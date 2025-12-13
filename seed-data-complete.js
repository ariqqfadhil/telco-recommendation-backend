// seed-data-complete.js

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');
const Product = require('./src/models/Product');

// Sample Users with varied data
const users = [
  {
    phoneNumber: '081234567890',
    name: 'Admin User',
    role: 'admin',
    isVerified: true,
    deviceBrand: 'Apple',
    planType: 'Postpaid',
    validity: 30,
    balance: 150000,
    dataQuota: 25600, // 25GB
    videoQuota: 15360, // 15GB
    smsQuota: 500,
    voiceQuota: 1000,
    preferences: {
      usageType: 'mixed',
      budget: 'high',
      interests: ['streaming', 'gaming'],
    },
  },
  {
    phoneNumber: '081234567891',
    name: 'Regular User',
    role: 'user',
    isVerified: true,
    deviceBrand: 'Samsung',
    planType: 'Prepaid',
    validity: 30,
    balance: 75000,
    dataQuota: 10240, // 10GB
    videoQuota: 5120, // 5GB
    smsQuota: 200,
    voiceQuota: 300,
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
    deviceBrand: 'Xiaomi',
    planType: 'Postpaid',
    validity: 30,
    balance: 200000,
    dataQuota: 51200, // 50GB
    videoQuota: 30720, // 30GB
    smsQuota: 1000,
    voiceQuota: 2000,
    preferences: {
      usageType: 'data',
      budget: 'high',
      interests: ['streaming', 'gaming', 'work'],
    },
  },
  {
    phoneNumber: '081234567893',
    name: 'Voice User',
    role: 'user',
    isVerified: true,
    deviceBrand: 'Oppo',
    planType: 'Prepaid',
    validity: 14,
    balance: 30000,
    dataQuota: 2048, // 2GB
    videoQuota: 1024, // 1GB
    smsQuota: 100,
    voiceQuota: 500,
    preferences: {
      usageType: 'voice',
      budget: 'low',
      interests: ['work'],
    },
  },
  {
    phoneNumber: '081234567894',
    name: 'Budget User',
    role: 'user',
    isVerified: true,
    deviceBrand: 'Vivo',
    planType: 'Prepaid',
    validity: 7,
    balance: 15000,
    dataQuota: 3072, // 3GB
    videoQuota: 512, // 512MB
    smsQuota: 50,
    voiceQuota: 100,
    preferences: {
      usageType: 'mixed',
      budget: 'low',
      interests: ['social-media', 'browsing'],
    },
  },
  {
    phoneNumber: '081234567895',
    name: 'Streaming Enthusiast',
    role: 'user',
    isVerified: true,
    deviceBrand: 'Realme',
    planType: 'Postpaid',
    validity: 30,
    balance: 120000,
    dataQuota: 20480, // 20GB
    videoQuota: 40960, // 40GB unlimited streaming
    smsQuota: 300,
    voiceQuota: 600,
    preferences: {
      usageType: 'data',
      budget: 'high',
      interests: ['streaming'],
    },
  },
];

// 40 Sample Products - FIXED streaming products
const products = [
  // ========== DATA BOOSTER (10 products) ==========
  {
    name: 'Data Booster 5GB',
    category: 'data',
    description: 'Boost your data quota with extra 5GB high-speed internet',
    price: 30000,
    specifications: { dataQuota: 5120, validity: 30 },
    targetOffer: 'Data Booster',
  },
  {
    name: 'Data Booster 10GB',
    category: 'data',
    description: 'Boost your data quota with extra 10GB high-speed internet',
    price: 50000,
    specifications: { dataQuota: 10240, validity: 30 },
    targetOffer: 'Data Booster',
  },
  {
    name: 'Data Booster 15GB',
    category: 'data',
    description: 'Extra 15GB data for regular users',
    price: 70000,
    specifications: { dataQuota: 15360, validity: 30 },
    targetOffer: 'Data Booster',
  },
  {
    name: 'Data Booster 25GB',
    category: 'data',
    description: 'Extra 25GB data for heavy users',
    price: 100000,
    specifications: { dataQuota: 25600, validity: 30 },
    targetOffer: 'Data Booster',
  },
  {
    name: 'Data Booster 50GB',
    category: 'data',
    description: 'Massive 50GB data boost for power users',
    price: 180000,
    specifications: { dataQuota: 51200, validity: 30 },
    targetOffer: 'Data Booster',
  },
  {
    name: 'Data Booster 3GB Weekly',
    category: 'data',
    description: 'Quick 3GB boost valid for 7 days',
    price: 20000,
    specifications: { dataQuota: 3072, validity: 7 },
    targetOffer: 'Data Booster',
  },
  {
    name: 'Data Booster 8GB Weekend',
    category: 'data',
    description: 'Weekend special 8GB for 3 days',
    price: 35000,
    specifications: { dataQuota: 8192, validity: 3 },
    targetOffer: 'Data Booster',
  },
  {
    name: 'Data Booster Midnight 20GB',
    category: 'data',
    description: '20GB for midnight browsing (00:00-06:00)',
    price: 45000,
    specifications: { dataQuota: 20480, validity: 30 },
    targetOffer: 'Data Booster',
  },
  {
    name: 'Data Booster Ultra 100GB',
    category: 'data',
    description: 'Ultimate 100GB for extreme users',
    price: 300000,
    specifications: { dataQuota: 102400, validity: 30 },
    targetOffer: 'Data Booster',
  },
  {
    name: 'Data Booster Daily 1GB',
    category: 'data',
    description: 'Daily 1GB renewable package',
    price: 10000,
    specifications: { dataQuota: 1024, validity: 1 },
    targetOffer: 'Data Booster',
  },

  // ========== VOICE BUNDLE (6 products) ==========
  {
    name: 'Voice Bundle 100 Minutes',
    category: 'voice',
    description: '100 minutes calls to all operators',
    price: 20000,
    specifications: { voiceMinutes: 100, validity: 30 },
    targetOffer: 'Voice Bundle',
  },
  {
    name: 'Voice Bundle 300 Minutes',
    category: 'voice',
    description: '300 minutes calls to all operators',
    price: 50000,
    specifications: { voiceMinutes: 300, validity: 30 },
    targetOffer: 'Voice Bundle',
  },
  {
    name: 'Voice Bundle 500 Minutes',
    category: 'voice',
    description: '500 minutes calls to all operators',
    price: 80000,
    specifications: { voiceMinutes: 500, validity: 30 },
    targetOffer: 'Voice Bundle',
  },
  {
    name: 'Voice Bundle Unlimited',
    category: 'voice',
    description: 'Unlimited calls to all operators',
    price: 100000,
    specifications: { voiceMinutes: 999999, validity: 30 },
    targetOffer: 'Voice Bundle',
  },
  {
    name: 'Voice Bundle Family 1000 Minutes',
    category: 'voice',
    description: '1000 minutes shared family calling',
    price: 120000,
    specifications: { voiceMinutes: 1000, validity: 30 },
    targetOffer: 'Voice Bundle',
  },
  {
    name: 'Voice Bundle Weekend Unlimited',
    category: 'voice',
    description: 'Unlimited calls on weekends only',
    price: 40000,
    specifications: { voiceMinutes: 999999, validity: 30 },
    targetOffer: 'Voice Bundle',
  },

  // ========== ROAMING PASS (4 products) ==========
  {
    name: 'ASEAN Roaming Pass 3 Days',
    category: 'roaming',
    description: 'Stay connected across ASEAN for 3 days',
    price: 50000,
    specifications: {
      roaming: {
        isAvailable: true,
        countries: ['Singapore', 'Malaysia', 'Thailand'],
        dataQuota: 1024,
        voiceMinutes: 30,
      },
      validity: 3,
    },
    targetOffer: 'Roaming Pass',
  },
  {
    name: 'ASEAN Roaming Pass 7 Days',
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
  {
    name: 'Global Roaming Pass 14 Days',
    category: 'roaming',
    description: 'Worldwide roaming coverage for 2 weeks',
    price: 150000,
    specifications: {
      roaming: {
        isAvailable: true,
        countries: ['Global Coverage'],
        dataQuota: 5120,
        voiceMinutes: 100,
      },
      validity: 14,
    },
    targetOffer: 'Roaming Pass',
  },
  {
    name: 'Global Roaming Pass 30 Days',
    category: 'roaming',
    description: 'Premium worldwide roaming for 1 month',
    price: 250000,
    specifications: {
      roaming: {
        isAvailable: true,
        countries: ['Global Coverage'],
        dataQuota: 10240,
        voiceMinutes: 200,
      },
      validity: 30,
    },
    targetOffer: 'Roaming Pass',
  },

  // ========== STREAMING PARTNER PACK (7 products) - FIXED! ==========
  {
    name: 'Netflix Basic Package',
    category: 'streaming',
    description: 'Netflix Basic + 10GB streaming data',
    price: 80000,
    specifications: { videoDataQuota: 10240, validity: 30 }, // FIXED: videoDataQuota
    targetOffer: 'Streaming Partner Pack',
  },
  {
    name: 'Netflix Premium Package',
    category: 'streaming',
    description: 'Netflix Premium + 15GB streaming data',
    price: 120000,
    specifications: { videoDataQuota: 15360, validity: 30 }, // FIXED: videoDataQuota
    targetOffer: 'Streaming Partner Pack',
  },
  {
    name: 'Disney+ Hotstar Bundle',
    category: 'streaming',
    description: 'Disney+ Hotstar + 10GB video quota',
    price: 90000,
    specifications: { videoDataQuota: 10240, validity: 30 }, // FIXED: videoDataQuota
    targetOffer: 'Streaming Partner Pack',
  },
  {
    name: 'YouTube Premium Pack',
    category: 'streaming',
    description: 'YouTube Premium + unlimited YouTube streaming',
    price: 85000,
    specifications: { videoDataQuota: 999999, validity: 30 }, // FIXED: videoDataQuota
    targetOffer: 'Streaming Partner Pack',
  },
  {
    name: 'Spotify Premium Bundle',
    category: 'streaming',
    description: 'Spotify Premium + 5GB music streaming',
    price: 60000,
    specifications: { videoDataQuota: 5120, validity: 30 }, // FIXED: videoDataQuota (for music videos)
    targetOffer: 'Streaming Partner Pack',
  },
  {
    name: 'Gaming & Streaming Pack',
    category: 'streaming',
    description: 'Low latency gaming + 20GB for streaming',
    price: 150000,
    specifications: { videoDataQuota: 20480, validity: 30 }, // FIXED: videoDataQuota
    targetOffer: 'Streaming Partner Pack',
  },
  {
    name: 'All Apps Streaming Unlimited',
    category: 'streaming',
    description: 'Unlimited streaming for all video apps',
    price: 200000,
    specifications: { videoDataQuota: 999999, validity: 30 }, // FIXED: videoDataQuota
    targetOffer: 'Streaming Partner Pack',
  },

  // ========== FAMILY PLAN OFFER (3 products) ==========
  {
    name: 'Family Plan 30GB',
    category: 'combo',
    description: 'Share 30GB data + 500 minutes calls for family',
    price: 150000,
    specifications: {
      dataQuota: 30720,
      voiceMinutes: 500,
      smsCount: 300,
      validity: 30,
    },
    targetOffer: 'Family Plan Offer',
  },
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
  {
    name: 'Family Plan 100GB Premium',
    category: 'combo',
    description: 'Premium family package with 100GB shared data',
    price: 350000,
    specifications: {
      dataQuota: 102400,
      voiceMinutes: 999999,
      smsCount: 1000,
      validity: 30,
    },
    targetOffer: 'Family Plan Offer',
  },

  // ========== DEVICE UPGRADE OFFER (2 products) ==========
  {
    name: 'Smartphone Upgrade Basic',
    category: 'device',
    description: 'Entry smartphone with 20GB data package',
    price: 300000,
    specifications: { dataQuota: 20480, voiceMinutes: 300, validity: 30 },
    targetOffer: 'Device Upgrade Offer',
  },
  {
    name: 'Smartphone Upgrade Premium',
    category: 'device',
    description: 'Premium smartphone with 50GB data package',
    price: 800000,
    specifications: { dataQuota: 51200, voiceMinutes: 999999, validity: 30 },
    targetOffer: 'Device Upgrade Offer',
  },

  // ========== RETENTION OFFER (2 products) ==========
  {
    name: 'Loyalty Reward Silver',
    category: 'combo',
    description: 'Special silver tier loyalty package',
    price: 100000,
    specifications: {
      dataQuota: 25600,
      voiceMinutes: 500,
      smsCount: 200,
      validity: 30,
    },
    targetOffer: 'Retention Offer',
  },
  {
    name: 'Loyalty Reward Gold',
    category: 'combo',
    description: 'Premium gold tier loyalty package',
    price: 150000,
    specifications: {
      dataQuota: 40960,
      voiceMinutes: 999999,
      smsCount: 500,
      validity: 30,
    },
    targetOffer: 'Retention Offer',
  },

  // ========== TOP-UP PROMO (2 products) ==========
  {
    name: 'Top-up Bonus 5GB',
    category: 'data',
    description: 'Get bonus 5GB on your next top-up',
    price: 25000,
    specifications: { dataQuota: 5120, validity: 7 },
    targetOffer: 'Top-up Promo',
  },
  {
    name: 'Top-up Bonus 10GB',
    category: 'data',
    description: 'Get bonus 10GB on top-up above 100k',
    price: 50000,
    specifications: { dataQuota: 10240, validity: 14 },
    targetOffer: 'Top-up Promo',
  },

  // ========== GENERAL OFFER (4 products) ==========
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
    name: 'Combo Standard',
    category: 'combo',
    description: 'Balanced package for regular users',
    price: 120000,
    specifications: {
      dataQuota: 25600,
      voiceMinutes: 200,
      smsCount: 200,
      validity: 30,
    },
    targetOffer: 'General Offer',
  },
  {
    name: 'Combo Premium',
    category: 'combo',
    description: 'Premium package with generous quotas',
    price: 200000,
    specifications: {
      dataQuota: 51200,
      voiceMinutes: 500,
      smsCount: 300,
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
    console.log('🌱 Starting database seeding (Updated with Frontend Requirements)...');
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
    console.log('👤 Seeding users with varied quotas...');
    const insertedUsers = await User.insertMany(users);
    console.log(`✅ Inserted ${insertedUsers.length} users`);
    console.log('');
    console.log('📋 Test Accounts:');
    insertedUsers.forEach(user => {
      console.log(`   - ${user.phoneNumber} (${user.role})`);
      console.log(`     Name: ${user.name}`);
      console.log(`     Device: ${user.deviceBrand} | Plan: ${user.planType}`);
      console.log(`     Validity: ${user.validity} days`);
      console.log(`     Balance: Rp ${user.balance.toLocaleString('id-ID')}`);
      console.log(`     Data: ${(user.dataQuota / 1024).toFixed(1)}GB | Video: ${(user.videoQuota / 1024).toFixed(1)}GB`);
      console.log(`     SMS: ${user.smsQuota} | Voice: ${user.voiceQuota} min`);
      console.log('');
    });

    // Insert products
    console.log('📦 Seeding products (FIXED streaming products)...');
    const insertedProducts = await Product.insertMany(products);
    console.log(`✅ Inserted ${insertedProducts.length} products`);
    console.log('');

    // Verify streaming products
    const streamingProducts = await Product.find({ category: 'streaming' });
    console.log('🎬 Streaming Products Verification:');
    streamingProducts.forEach(prod => {
      const hasCorrectField = prod.specifications.videoDataQuota !== undefined;
      const status = hasCorrectField ? '✅' : '❌';
      console.log(`   ${status} ${prod.name}: videoDataQuota = ${prod.specifications.videoDataQuota || 'N/A'}`);
    });
    console.log('');

    // Count by category
    const categoryCount = await Product.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    console.log('📊 Products by category:');
    categoryCount.forEach(item => {
      console.log(`   - ${item._id}: ${item.count} products`);
    });
    console.log('');

    console.log('═══════════════════════════════════════════════════');
    console.log('🎉 Database seeding completed successfully!');
    console.log('═══════════════════════════════════════════════════');
    console.log('');
    console.log('✅ FRONTEND REQUIREMENTS IMPLEMENTED:');
    console.log('   1. User fields: deviceBrand, planType, validity ✅');
    console.log('   2. User quotas: balance, data, video, sms, voice ✅');
    console.log('   3. Fixed streaming products: videoDataQuota ✅');
    console.log('   4. Varied user data for testing ✅');
    console.log('═══════════════════════════════════════════════════');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    console.error(error.stack);
    process.exit(1);
  }
}

seedData();