require('dotenv').config();
const mongoose = require('mongoose');

async function testRecommendation() {
  try {
    console.log('🧪 Testing Recommendation Handler...');
    console.log('');

    // Connect to database
    await mongoose.connect(process.env.DB_URI);
    console.log('✅ Connected to database');
    console.log('');

    // Import models and services
    const User = require('./src/models/User');
    const Product = require('./src/models/Product');
    const mlService = require('./src/services/mlService');

    // Test with actual user
    const userId = '6935a1ef3d0e67261ed10f96'; // User ID dari token
    
    console.log('📋 Step 1: Get user...');
    const user = await User.findById(userId).select('preferences').lean();
    if (!user) {
      throw new Error('User not found');
    }
    console.log('✅ User found:', JSON.stringify(user, null, 2));
    console.log('');

    console.log('📋 Step 2: Generate default usage features...');
    const usageFeatures = {
      avgDataUsage: 5000,
      avgCallDuration: 100,
      avgSmsCount: 50,
      avgSpending: 75000,
      pctVideoUsage: 0.3,
      topupFreq: 1,
      complaintCount: 0,
      isHeavyDataUser: false,
      contentType: user.preferences?.usageType || 'mixed',
      roamingFrequency: 'never',
      hasFamilyPlan: false,
      travelScore: 0.1,
      deviceBrand: 'Unknown',
      deviceOS: 'Unknown',
      userSegment: 'balanced_user',
      clusterLabel: null,
      planType: 'standard',
      dataPoints: 0,
      completeness: 0.5,
    };
    console.log('✅ Usage features:', JSON.stringify(usageFeatures, null, 2));
    console.log('');

    console.log('📋 Step 3: Call ML service...');
    const mlRecommendations = await mlService.getRecommendations({
      userId,
      preferences: user.preferences,
      usageFeatures,
      algorithm: 'hybrid',
    });
    console.log('✅ ML recommendations:', JSON.stringify(mlRecommendations, null, 2));
    console.log('');

    console.log('📋 Step 4: Get all products...');
    const allProducts = await Product.find({ isActive: true }).lean();
    console.log('✅ Total products:', allProducts.length);
    console.log('');

    console.log('📋 Step 5: Map recommendations to products...');
    const limit = 5;
    const recommendedProducts = mlRecommendations
      .slice(0, limit)
      .map((rec, index) => {
        let product;
        
        // Try to find product by name
        if (rec.product_name) {
          product = allProducts.find(p => 
            p.name.toLowerCase().includes(rec.product_name.toLowerCase()) ||
            rec.product_name.toLowerCase().includes(p.name.toLowerCase())
          );
        }
        
        // Fallback: use product by index
        if (!product) {
          product = allProducts[index % allProducts.length];
        }
        
        return {
          productId: product._id,
          score: rec.score || 0.5,
          reason: rec.reason || 'Recommended based on your usage pattern',
          productName: product.name,
          category: product.category,
          price: product.price,
        };
      });

    console.log('✅ Mapped products:');
    recommendedProducts.forEach((rec, idx) => {
      console.log(`   ${idx + 1}. ${rec.productName} (${rec.category}) - Score: ${rec.score}`);
      console.log(`      Reason: ${rec.reason}`);
    });
    console.log('');

    console.log('🎉 Test completed successfully!');
    console.log('');
    console.log('Expected API response structure:');
    console.log(JSON.stringify({
      status: 'success',
      message: 'Recommendations retrieved successfully',
      data: {
        recommendations: recommendedProducts,
        metadata: {
          algorithm: 'hybrid',
          responseTime: '100ms',
          timestamp: new Date().toISOString(),
        }
      }
    }, null, 2));

    process.exit(0);
  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

testRecommendation();