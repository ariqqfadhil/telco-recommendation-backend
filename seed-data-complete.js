/**
 * Complete Seed Data Script
 * 40 Products across 6 categories
 * Run: node seed-data-complete.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');
const Product = require('./src/models/Product');
const { hashPassword } = require('./src/utils/hash');

// Connect to database
mongoose.connect(process.env.DB_URI || 'mongodb://localhost:27017/telco_recommendation')
  .then(() => console.log('✅ Connected to database'))
  .catch(err => {
    console.error('❌ Database connection failed:', err);
    process.exit(1);
  });

// Sample Users
const sampleUsers = [
  {
    phoneNumber: '081234567890',
    pin: 'admin1', // Will be hashed
    name: 'Admin User',
    role: 'admin',
    preferences: {
      usageType: 'mixed',
      budget: 'high',
      interests: ['streaming', 'gaming', 'work'],
    },
  },
  {
    phoneNumber: '081234567891',
    pin: '123456',
    name: 'John Doe',
    role: 'user',
    preferences: {
      usageType: 'data',
      budget: 'medium',
      interests: ['streaming', 'social-media'],
    },
  },
  {
    phoneNumber: '081234567892',
    pin: '123456',
    name: 'Jane Smith',
    role: 'user',
    preferences: {
      usageType: 'voice',
      budget: 'low',
      interests: ['work'],
    },
  },
];

// Complete Product Catalog - 40 Products
const sampleProducts = [
  // CATEGORY: DATA (10 products)
  {
    name: 'Paket Internet Unlimited',
    category: 'data',
    price: 150000,
    description: 'Paket internet unlimited dengan kecepatan 4G LTE untuk streaming dan browsing tanpa batas',
    specifications: { dataQuota: 999999, validity: 30, speedLimit: 'unlimited' },
    features: { hasStreaming: true, hasGaming: true, hasSocialMedia: true, hasRoaming: false, hasHotspot: true },
    purchaseCount: 250, rating: { average: 4.7, count: 200 }
  },
  {
    name: 'Paket Data 50GB',
    category: 'data',
    price: 100000,
    description: 'Paket data jumbo 50GB untuk kebutuhan internet berat',
    specifications: { dataQuota: 51200, validity: 30, speedLimit: 'unlimited' },
    features: { hasStreaming: true, hasGaming: true, hasSocialMedia: true, hasRoaming: false, hasHotspot: true },
    purchaseCount: 180, rating: { average: 4.6, count: 150 }
  },
  {
    name: 'Paket Data 25GB',
    category: 'data',
    price: 60000,
    description: 'Paket data 25GB hemat untuk penggunaan harian',
    specifications: { dataQuota: 25600, validity: 30, speedLimit: '4Mbps' },
    features: { hasStreaming: true, hasGaming: false, hasSocialMedia: true, hasRoaming: false, hasHotspot: true },
    purchaseCount: 320, rating: { average: 4.5, count: 280 }
  },
  {
    name: 'Paket Data 10GB',
    category: 'data',
    price: 30000,
    description: 'Paket data 10GB untuk kebutuhan ringan',
    specifications: { dataQuota: 10240, validity: 30, speedLimit: '2Mbps' },
    features: { hasStreaming: false, hasGaming: false, hasSocialMedia: true, hasRoaming: false, hasHotspot: false },
    purchaseCount: 450, rating: { average: 4.3, count: 380 }
  },
  {
    name: 'Paket Gaming 30GB',
    category: 'data',
    price: 75000,
    description: 'Paket khusus gaming dengan ping rendah dan kuota besar',
    specifications: { dataQuota: 30720, validity: 30, speedLimit: 'unlimited' },
    features: { hasStreaming: false, hasGaming: true, hasSocialMedia: true, hasRoaming: false, hasHotspot: true },
    purchaseCount: 95, rating: { average: 4.8, count: 75 }
  },
  {
    name: 'Paket Harian 2GB',
    category: 'data',
    price: 5000,
    description: 'Paket data harian 2GB untuk kebutuhan sehari-hari',
    specifications: { dataQuota: 2048, validity: 1, speedLimit: '2Mbps' },
    features: { hasStreaming: false, hasGaming: false, hasSocialMedia: true, hasRoaming: false, hasHotspot: false },
    purchaseCount: 600, rating: { average: 4.2, count: 520 }
  },
  {
    name: 'Paket Mingguan 7GB',
    category: 'data',
    price: 15000,
    description: 'Paket data mingguan 7GB untuk 7 hari',
    specifications: { dataQuota: 7168, validity: 7, speedLimit: '2Mbps' },
    features: { hasStreaming: true, hasGaming: false, hasSocialMedia: true, hasRoaming: false, hasHotspot: false },
    purchaseCount: 280, rating: { average: 4.4, count: 230 }
  },
  {
    name: 'Paket Malam 10GB',
    category: 'data',
    price: 20000,
    description: 'Paket data 10GB khusus malam hari (00:00-06:00)',
    specifications: { dataQuota: 10240, validity: 30, speedLimit: 'unlimited' },
    features: { hasStreaming: true, hasGaming: true, hasSocialMedia: true, hasRoaming: false, hasHotspot: false },
    purchaseCount: 150, rating: { average: 4.1, count: 120 }
  },
  {
    name: 'Paket Sosmed 5GB',
    category: 'data',
    price: 12000,
    description: 'Kuota khusus untuk Instagram, Facebook, Twitter, TikTok',
    specifications: { dataQuota: 5120, validity: 30, speedLimit: '2Mbps' },
    features: { hasStreaming: false, hasGaming: false, hasSocialMedia: true, hasRoaming: false, hasHotspot: false },
    purchaseCount: 380, rating: { average: 4.4, count: 320 }
  },
  {
    name: 'Paket Turbo 100GB',
    category: 'data',
    price: 180000,
    description: 'Paket data super jumbo 100GB untuk kebutuhan ekstrim',
    specifications: { dataQuota: 102400, validity: 30, speedLimit: 'unlimited' },
    features: { hasStreaming: true, hasGaming: true, hasSocialMedia: true, hasRoaming: true, hasHotspot: true },
    purchaseCount: 45, rating: { average: 4.9, count: 38 }
  },

  // CATEGORY: VOICE (6 products)
  {
    name: 'Paket Telepon Unlimited',
    category: 'voice',
    price: 50000,
    description: 'Telepon sepuasnya ke semua operator dengan kualitas jernih',
    specifications: { voiceMinutes: 999999, validity: 30 },
    features: { hasStreaming: false, hasGaming: false, hasSocialMedia: false, hasRoaming: false, hasHotspot: false },
    purchaseCount: 200, rating: { average: 4.7, count: 180 }
  },
  {
    name: 'Paket Nelpon 300 Menit',
    category: 'voice',
    price: 30000,
    description: '300 menit telepon ke semua operator',
    specifications: { voiceMinutes: 300, validity: 30 },
    features: { hasStreaming: false, hasGaming: false, hasSocialMedia: false, hasRoaming: false, hasHotspot: false },
    purchaseCount: 150, rating: { average: 4.5, count: 130 }
  },
  {
    name: 'Paket Nelpon 100 Menit',
    category: 'voice',
    price: 15000,
    description: '100 menit telepon untuk kebutuhan komunikasi',
    specifications: { voiceMinutes: 100, validity: 30 },
    features: { hasStreaming: false, hasGaming: false, hasSocialMedia: false, hasRoaming: false, hasHotspot: false },
    purchaseCount: 220, rating: { average: 4.3, count: 190 }
  },
  {
    name: 'Paket Telepon Sesama Operator',
    category: 'voice',
    price: 20000,
    description: 'Unlimited telepon ke sesama operator',
    specifications: { voiceMinutes: 999999, validity: 30 },
    features: { hasStreaming: false, hasGaming: false, hasSocialMedia: false, hasRoaming: false, hasHotspot: false },
    purchaseCount: 180, rating: { average: 4.4, count: 160 }
  },
  {
    name: 'Paket Nelpon Harian 30 Menit',
    category: 'voice',
    price: 3000,
    description: '30 menit telepon untuk hari ini',
    specifications: { voiceMinutes: 30, validity: 1 },
    features: { hasStreaming: false, hasGaming: false, hasSocialMedia: false, hasRoaming: false, hasHotspot: false },
    purchaseCount: 350, rating: { average: 4.2, count: 300 }
  },
  {
    name: 'Paket Telepon Internasional',
    category: 'voice',
    price: 75000,
    description: '100 menit telepon ke luar negeri',
    specifications: { voiceMinutes: 100, validity: 30 },
    features: { hasStreaming: false, hasGaming: false, hasSocialMedia: false, hasRoaming: true, hasHotspot: false },
    purchaseCount: 35, rating: { average: 4.6, count: 28 }
  },

  // CATEGORY: SMS (4 products)
  {
    name: 'Paket SMS Unlimited',
    category: 'sms',
    price: 10000,
    description: 'SMS unlimited ke semua operator',
    specifications: { smsCount: 999999, validity: 30 },
    features: { hasStreaming: false, hasGaming: false, hasSocialMedia: false, hasRoaming: false, hasHotspot: false },
    purchaseCount: 120, rating: { average: 4.1, count: 100 }
  },
  {
    name: 'Paket SMS 500',
    category: 'sms',
    price: 5000,
    description: '500 SMS ke semua operator',
    specifications: { smsCount: 500, validity: 30 },
    features: { hasStreaming: false, hasGaming: false, hasSocialMedia: false, hasRoaming: false, hasHotspot: false },
    purchaseCount: 180, rating: { average: 4.0, count: 150 }
  },
  {
    name: 'Paket SMS 100',
    category: 'sms',
    price: 2000,
    description: '100 SMS untuk kebutuhan OTP dan notifikasi',
    specifications: { smsCount: 100, validity: 30 },
    features: { hasStreaming: false, hasGaming: false, hasSocialMedia: false, hasRoaming: false, hasHotspot: false },
    purchaseCount: 280, rating: { average: 3.9, count: 240 }
  },
  {
    name: 'Paket SMS Harian',
    category: 'sms',
    price: 500,
    description: '20 SMS untuk hari ini',
    specifications: { smsCount: 20, validity: 1 },
    features: { hasStreaming: false, hasGaming: false, hasSocialMedia: false, hasRoaming: false, hasHotspot: false },
    purchaseCount: 420, rating: { average: 3.8, count: 380 }
  },

  // CATEGORY: COMBO (8 products)
  {
    name: 'Paket Combo Hemat',
    category: 'combo',
    price: 85000,
    description: 'Kombinasi paket data, telepon, dan SMS dengan harga terjangkau',
    specifications: { dataQuota: 15360, voiceMinutes: 100, smsCount: 100, validity: 30, speedLimit: '2Mbps' },
    features: { hasStreaming: true, hasGaming: false, hasSocialMedia: true, hasRoaming: false, hasHotspot: true },
    purchaseCount: 280, rating: { average: 4.5, count: 240 }
  },
  {
    name: 'Paket Combo Lengkap',
    category: 'combo',
    price: 150000,
    description: 'Paket all-in-one: 30GB data + unlimited voice + 200 SMS',
    specifications: { dataQuota: 30720, voiceMinutes: 999999, smsCount: 200, validity: 30, speedLimit: 'unlimited' },
    features: { hasStreaming: true, hasGaming: true, hasSocialMedia: true, hasRoaming: false, hasHotspot: true },
    purchaseCount: 220, rating: { average: 4.7, count: 190 }
  },
  {
    name: 'Paket Keluarga',
    category: 'combo',
    price: 200000,
    description: 'Paket keluarga: 50GB data + unlimited voice all operator',
    specifications: { dataQuota: 51200, voiceMinutes: 999999, smsCount: 500, validity: 30, speedLimit: 'unlimited' },
    features: { hasStreaming: true, hasGaming: true, hasSocialMedia: true, hasRoaming: false, hasHotspot: true },
    purchaseCount: 150, rating: { average: 4.8, count: 128 }
  },
  {
    name: 'Paket Combo Student',
    category: 'combo',
    price: 50000,
    description: 'Paket spesial pelajar: 10GB + 50 menit + 50 SMS',
    specifications: { dataQuota: 10240, voiceMinutes: 50, smsCount: 50, validity: 30, speedLimit: '2Mbps' },
    features: { hasStreaming: true, hasGaming: false, hasSocialMedia: true, hasRoaming: false, hasHotspot: false },
    purchaseCount: 380, rating: { average: 4.4, count: 340 }
  },
  {
    name: 'Paket Combo Bisnis',
    category: 'combo',
    price: 250000,
    description: 'Paket untuk profesional: 75GB + unlimited voice + unlimited SMS',
    specifications: { dataQuota: 76800, voiceMinutes: 999999, smsCount: 999999, validity: 30, speedLimit: 'unlimited' },
    features: { hasStreaming: true, hasGaming: false, hasSocialMedia: true, hasRoaming: true, hasHotspot: true },
    purchaseCount: 85, rating: { average: 4.9, count: 72 }
  },
  {
    name: 'Paket Combo Mini',
    category: 'combo',
    price: 35000,
    description: 'Paket mini: 5GB + 30 menit + 30 SMS',
    specifications: { dataQuota: 5120, voiceMinutes: 30, smsCount: 30, validity: 30, speedLimit: '2Mbps' },
    features: { hasStreaming: false, hasGaming: false, hasSocialMedia: true, hasRoaming: false, hasHotspot: false },
    purchaseCount: 480, rating: { average: 4.2, count: 420 }
  },
  {
    name: 'Paket Combo Harian',
    category: 'combo',
    price: 8000,
    description: 'Combo harian: 1GB + 20 menit + 20 SMS',
    specifications: { dataQuota: 1024, voiceMinutes: 20, smsCount: 20, validity: 1, speedLimit: '2Mbps' },
    features: { hasStreaming: false, hasGaming: false, hasSocialMedia: true, hasRoaming: false, hasHotspot: false },
    purchaseCount: 550, rating: { average: 4.0, count: 490 }
  },
  {
    name: 'Paket Combo Premium',
    category: 'combo',
    price: 300000,
    description: 'Paket premium ultimate dengan semua fitur',
    specifications: { dataQuota: 102400, voiceMinutes: 999999, smsCount: 999999, validity: 30, speedLimit: 'unlimited' },
    features: { hasStreaming: true, hasGaming: true, hasSocialMedia: true, hasRoaming: true, hasHotspot: true },
    purchaseCount: 42, rating: { average: 5.0, count: 38 }
  },

  // CATEGORY: VOD (5 products)
  {
    name: 'Paket Netflix Premium',
    category: 'vod',
    price: 120000,
    description: 'Akses Netflix Premium 1 bulan + 15GB kuota streaming',
    specifications: { dataQuota: 15360, validity: 30, speedLimit: 'unlimited' },
    features: { hasStreaming: true, hasGaming: false, hasSocialMedia: false, hasRoaming: false, hasHotspot: false },
    purchaseCount: 180, rating: { average: 4.7, count: 155 }
  },
  {
    name: 'Paket Disney+ Hotstar',
    category: 'vod',
    price: 90000,
    description: 'Disney+ Hotstar 1 bulan + 10GB kuota streaming',
    specifications: { dataQuota: 10240, validity: 30, speedLimit: 'unlimited' },
    features: { hasStreaming: true, hasGaming: false, hasSocialMedia: false, hasRoaming: false, hasHotspot: false },
    purchaseCount: 145, rating: { average: 4.6, count: 125 }
  },
  {
    name: 'Paket YouTube Premium',
    category: 'vod',
    price: 85000,
    description: 'YouTube Premium 1 bulan + unlimited YouTube',
    specifications: { dataQuota: 999999, validity: 30, speedLimit: 'unlimited' },
    features: { hasStreaming: true, hasGaming: false, hasSocialMedia: true, hasRoaming: false, hasHotspot: false },
    purchaseCount: 220, rating: { average: 4.8, count: 195 }
  },
  {
    name: 'Paket Video All Platform',
    category: 'vod',
    price: 200000,
    description: 'Akses Netflix, Disney+, Prime Video + 30GB streaming',
    specifications: { dataQuota: 30720, validity: 30, speedLimit: 'unlimited' },
    features: { hasStreaming: true, hasGaming: false, hasSocialMedia: false, hasRoaming: false, hasHotspot: true },
    purchaseCount: 95, rating: { average: 4.9, count: 82 }
  },
  {
    name: 'Paket Prime Video',
    category: 'vod',
    price: 75000,
    description: 'Amazon Prime Video 1 bulan + 10GB kuota streaming',
    specifications: { dataQuota: 10240, validity: 30, speedLimit: 'unlimited' },
    features: { hasStreaming: true, hasGaming: false, hasSocialMedia: false, hasRoaming: false, hasHotspot: false },
    purchaseCount: 115, rating: { average: 4.5, count: 98 }
  },

  // CATEGORY: STREAMING (7 products)
  {
    name: 'Paket Streaming HD',
    category: 'streaming',
    price: 95000,
    description: 'Paket khusus streaming video HD dari berbagai platform',
    specifications: { dataQuota: 20480, validity: 30, speedLimit: 'unlimited' },
    features: { hasStreaming: true, hasGaming: false, hasSocialMedia: true, hasRoaming: false, hasHotspot: false },
    purchaseCount: 175, rating: { average: 4.6, count: 148 }
  },
  {
    name: 'Paket Music Unlimited',
    category: 'streaming',
    price: 40000,
    description: 'Streaming musik unlimited dari Spotify, Apple Music, Joox',
    specifications: { dataQuota: 5120, validity: 30, speedLimit: '2Mbps' },
    features: { hasStreaming: true, hasGaming: false, hasSocialMedia: false, hasRoaming: false, hasHotspot: false },
    purchaseCount: 280, rating: { average: 4.4, count: 245 }
  },
  {
    name: 'Paket Spotify Premium',
    category: 'streaming',
    price: 50000,
    description: 'Spotify Premium 1 bulan + unlimited music streaming',
    specifications: { dataQuota: 999999, validity: 30, speedLimit: '2Mbps' },
    features: { hasStreaming: true, hasGaming: false, hasSocialMedia: false, hasRoaming: false, hasHotspot: false },
    purchaseCount: 320, rating: { average: 4.7, count: 285 }
  },
  {
    name: 'Paket Live Streaming',
    category: 'streaming',
    price: 60000,
    description: 'Paket untuk live streaming di Twitch, YouTube Live',
    specifications: { dataQuota: 15360, validity: 30, speedLimit: 'unlimited' },
    features: { hasStreaming: true, hasGaming: false, hasSocialMedia: true, hasRoaming: false, hasHotspot: true },
    purchaseCount: 125, rating: { average: 4.5, count: 108 }
  },
  {
    name: 'Paket Content Creator',
    category: 'streaming',
    price: 150000,
    description: 'Paket untuk content creator: 50GB + unlimited upload',
    specifications: { dataQuota: 51200, validity: 30, speedLimit: 'unlimited' },
    features: { hasStreaming: true, hasGaming: false, hasSocialMedia: true, hasRoaming: false, hasHotspot: true },
    purchaseCount: 88, rating: { average: 4.8, count: 75 }
  },
  {
    name: 'Paket Video Conference',
    category: 'streaming',
    price: 70000,
    description: 'Paket untuk Zoom, Google Meet, Teams meeting',
    specifications: { dataQuota: 20480, validity: 30, speedLimit: 'unlimited' },
    features: { hasStreaming: true, hasGaming: false, hasSocialMedia: false, hasRoaming: false, hasHotspot: true },
    purchaseCount: 195, rating: { average: 4.6, count: 172 }
  },
  {
    name: 'Paket Streaming 4K',
    category: 'streaming',
    price: 180000,
    description: 'Paket premium untuk streaming 4K ultra HD',
    specifications: { dataQuota: 102400, validity: 30, speedLimit: 'unlimited' },
    features: { hasStreaming: true, hasGaming: true, hasSocialMedia: true, hasRoaming: false, hasHotspot: true },
    purchaseCount: 52, rating: { average: 4.9, count: 45 }
  },
];

// Seed function
async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...');
    console.log('');

    // Clear existing data
    await User.deleteMany({});
    await Product.deleteMany({});
    console.log('🗑️  Cleared existing data');
    console.log('');

    // Hash PINs for users
    for (let user of sampleUsers) {
      user.pin = await hashPassword(user.pin);
    }

    // Insert users
    const users = await User.insertMany(sampleUsers);
    console.log(`✅ Inserted ${users.length} users`);

    // Insert products
    const products = await Product.insertMany(sampleProducts);
    console.log(`✅ Inserted ${products.length} products`);
    console.log('');

    // Count by category
    const categoryCount = await Product.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    console.log('📊 Products by category:');
    categoryCount.forEach(cat => {
      console.log(`   - ${cat._id}: ${cat.count} products`);
    });
    console.log('');

    console.log('🎉 ========================================');
    console.log('   Database seeded successfully!');
    console.log('   ========================================');
    console.log('');
    console.log('   📝 Test Accounts:');
    console.log('');
    console.log('   Admin Account:');
    console.log('   Phone: 081234567890');
    console.log('   PIN: admin1');
    console.log('');
    console.log('   User Account 1:');
    console.log('   Phone: 081234567891');
    console.log('   PIN: 123456');
    console.log('');
    console.log('   User Account 2:');
    console.log('   Phone: 081234567892');
    console.log('   PIN: 123456');
    console.log('');
    console.log(`   📦 Total Products: ${products.length}`);
    console.log('   📊 Categories: Data, Voice, SMS, Combo, VOD, Streaming');
    console.log('   💰 Price Range: Rp 500 - Rp 300.000');
    console.log('');
    console.log('   ========================================');
    console.log('');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

// Run seeding
seedDatabase();