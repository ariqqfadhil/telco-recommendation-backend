/**
 * SAMPLE DATA - Seed Database Script
 * 
 * Jalankan script ini untuk populate database dengan sample data
 * Usage: node seed-data.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Import models
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
    name: 'Admin User',
    email: 'admin@telco.com',
    password: 'admin123', // Will be hashed
    phoneNumber: '081234567890',
    role: 'admin',
    preferences: {
      usageType: 'mixed',
      budget: 'high',
      interests: ['streaming', 'gaming', 'work'],
    },
  },
  {
    name: 'John Doe',
    email: 'john@example.com',
    password: 'password123',
    phoneNumber: '081234567891',
    role: 'user',
    preferences: {
      usageType: 'data',
      budget: 'medium',
      interests: ['streaming', 'social-media'],
    },
  },
  {
    name: 'Jane Smith',
    email: 'jane@example.com',
    password: 'password123',
    phoneNumber: '081234567892',
    role: 'user',
    preferences: {
      usageType: 'voice',
      budget: 'low',
      interests: ['work'],
    },
  },
];

// Sample Products
const sampleProducts = [
  {
    name: 'Paket Internet Unlimited',
    category: 'data',
    description: 'Paket internet unlimited dengan kecepatan 4G LTE untuk streaming dan browsing tanpa batas',
    price: 150000,
    specifications: {
      dataQuota: 999999, // "unlimited"
      validity: 30,
      speedLimit: 'unlimited',
    },
    features: {
      hasStreaming: true,
      hasGaming: true,
      hasSocialMedia: true,
      hasRoaming: false,
      hasHotspot: true,
    },
    imageUrl: 'https://example.com/images/unlimited.jpg',
    isActive: true,
  },
  {
    name: 'Paket Combo Hemat',
    category: 'combo',
    description: 'Kombinasi paket data, telepon, dan SMS dengan harga terjangkau',
    price: 85000,
    specifications: {
      dataQuota: 15000, // 15GB
      voiceMinutes: 100,
      smsCount: 100,
      validity: 30,
      speedLimit: '2Mbps',
    },
    features: {
      hasStreaming: true,
      hasGaming: false,
      hasSocialMedia: true,
      hasRoaming: false,
      hasHotspot: true,
    },
    imageUrl: 'https://example.com/images/combo.jpg',
    isActive: true,
    purchaseCount: 150,
    rating: {
      average: 4.5,
      count: 120,
    },
  },
  {
    name: 'Paket Telepon Unlimited',
    category: 'voice',
    description: 'Telepon sepuasnya ke semua operator dengan kualitas jernih',
    price: 50000,
    specifications: {
      voiceMinutes: 999999, // unlimited
      validity: 30,
    },
    features: {
      hasStreaming: false,
      hasGaming: false,
      hasSocialMedia: false,
      hasRoaming: false,
      hasHotspot: false,
    },
    imageUrl: 'https://example.com/images/voice.jpg',
    isActive: true,
    purchaseCount: 200,
    rating: {
      average: 4.7,
      count: 180,
    },
  },
  {
    name: 'Paket Gaming',
    category: 'data',
    description: 'Paket khusus untuk gaming dengan ping rendah dan kuota besar',
    price: 120000,
    specifications: {
      dataQuota: 25000, // 25GB
      validity: 30,
      speedLimit: 'unlimited',
    },
    features: {
      hasStreaming: false,
      hasGaming: true,
      hasSocialMedia: true,
      hasRoaming: false,
      hasHotspot: true,
    },
    imageUrl: 'https://example.com/images/gaming.jpg',
    isActive: true,
    purchaseCount: 95,
    rating: {
      average: 4.8,
      count: 75,
    },
  },
  {
    name: 'Paket Streaming HD',
    category: 'streaming',
    description: 'Paket khusus streaming video HD dari Netflix, YouTube, dan platform lainnya',
    price: 95000,
    specifications: {
      dataQuota: 20000, // 20GB
      validity: 30,
      speedLimit: 'unlimited',
    },
    features: {
      hasStreaming: true,
      hasGaming: false,
      hasSocialMedia: true,
      hasRoaming: false,
      hasHotspot: false,
    },
    imageUrl: 'https://example.com/images/streaming.jpg',
    isActive: true,
    purchaseCount: 180,
    rating: {
      average: 4.6,
      count: 145,
    },
  },
  {
    name: 'Paket Video on Demand',
    category: 'vod',
    description: 'Akses unlimited ke konten VOD pilihan dengan kualitas terbaik',
    price: 75000,
    specifications: {
      dataQuota: 10000, // 10GB untuk VOD
      validity: 30,
    },
    features: {
      hasStreaming: true,
      hasGaming: false,
      hasSocialMedia: false,
      hasRoaming: false,
      hasHotspot: false,
    },
    imageUrl: 'https://example.com/images/vod.jpg',
    isActive: true,
    purchaseCount: 65,
    rating: {
      average: 4.3,
      count: 50,
    },
  },
  {
    name: 'Paket Social Media',
    category: 'data',
    description: 'Kuota khusus untuk Instagram, Facebook, Twitter, dan TikTok',
    price: 35000,
    specifications: {
      dataQuota: 8000, // 8GB
      validity: 30,
      speedLimit: '2Mbps',
    },
    features: {
      hasStreaming: false,
      hasGaming: false,
      hasSocialMedia: true,
      hasRoaming: false,
      hasHotspot: false,
    },
    imageUrl: 'https://example.com/images/socmed.jpg',
    isActive: true,
    purchaseCount: 250,
    rating: {
      average: 4.4,
      count: 200,
    },
  },
];

// Seed function
async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...');

    // Clear existing data
    await User.deleteMany({});
    await Product.deleteMany({});
    console.log('🗑️  Cleared existing data');

    // Hash passwords for users
    for (let user of sampleUsers) {
      user.password = await hashPassword(user.password);
    }

    // Insert users
    const users = await User.insertMany(sampleUsers);
    console.log(`✅ Inserted ${users.length} users`);

    // Insert products
    const products = await Product.insertMany(sampleProducts);
    console.log(`✅ Inserted ${products.length} products`);

    console.log('');
    console.log('🎉 ========================================');
    console.log('   Database seeded successfully!');
    console.log('   ========================================');
    console.log('');
    console.log('   📝 Test Accounts:');
    console.log('');
    console.log('   Admin Account:');
    console.log('   Email: admin@telco.com');
    console.log('   Password: admin123');
    console.log('');
    console.log('   User Account 1:');
    console.log('   Email: john@example.com');
    console.log('   Password: password123');
    console.log('');
    console.log('   User Account 2:');
    console.log('   Email: jane@example.com');
    console.log('   Password: password123');
    console.log('');
    console.log(`   📦 Total Products: ${products.length}`);
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