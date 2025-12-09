require('dotenv').config();
const mlService = require('./src/services/mlService');

async function testMLIntegration() {
  console.log('🧪 Testing ML Integration...');
  console.log('');
  
  // Test data dengan format yang sesuai ML needs
  const testUserData = {
    userId: 'test_user_123',
    preferences: {
      usageType: 'data',
      budget: 'medium',
      interests: ['streaming', 'social-media']
    },
    usageFeatures: {
      avgDataUsage: 5200,        // MB (akan di-convert ke GB)
      avgCallDuration: 120,      // minutes
      avgSmsCount: 50,
      avgSpending: 85000,        // IDR
      isHeavyDataUser: false,
      userSegment: 'balanced_user',
      deviceBrand: 'Samsung',
      roamingFrequency: 'never',
      topupFreq: 1
    },
    algorithm: 'hybrid'
  };
  
  console.log('📤 Sending request to ML service...');
  console.log('User data:', JSON.stringify(testUserData, null, 2));
  console.log('');
  
  try {
    const recommendations = await mlService.getRecommendations(testUserData);
    
    console.log('✅ Success! Received recommendations:');
    console.log('');
    console.log('Recommendations:', JSON.stringify(recommendations, null, 2));
    console.log('');
    console.log(`📊 Total recommendations: ${recommendations.length}`);
    
    if (recommendations.length > 0) {
      console.log('');
      console.log('Sample recommendation:');
      console.log(`  Product ID: ${recommendations[0].product_id || 'N/A'}`);
      console.log(`  Score: ${recommendations[0].score}`);
      console.log(`  Reason: ${recommendations[0].reason}`);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Run test
testMLIntegration()
  .then(() => {
    console.log('');
    console.log('✅ Test completed');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Test error:', err);
    process.exit(1);
  });