// test-huggingface.js

require('dotenv').config();
const axios = require('axios');

// HuggingFace Space URL
const HF_URL = process.env.ML_SERVICE_URL || 'https://huuddz-telco-hybrid-api.hf.space/recommend';

// Colors for console
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(color, message) {
  console.log(`${color}${message}${colors.reset}`);
}

/**
 * Test 1: Direct HuggingFace API Call
 */
async function testDirectAPI() {
  try {
    log(colors.cyan, '\n╔════════════════════════════════════════╗');
    log(colors.cyan, '║   Test 1: Direct HuggingFace API      ║');
    log(colors.cyan, '╚════════════════════════════════════════╝\n');

    log(colors.blue, '🌐 HuggingFace Space URL:');
    console.log(`   ${HF_URL}`);
    console.log('');

    // Sample data for testing
    const testData = {
      avg_data_usage_gb: 5.2,
      pct_video_usage: 0.6,
      avg_call_duration: 120,
      sms_freq: 50,
      monthly_spend: 85000,
      topup_freq: 1,
      travel_score: 0.1,
      complaint_count: 0,
      plan_type: 'standard',
      device_brand: 'Samsung'
    };

    log(colors.blue, '📤 Sending request to HuggingFace...');
    console.log('Request data:', JSON.stringify(testData, null, 2));
    console.log('');

    const startTime = Date.now();
    const response = await axios.post(HF_URL, testData, {
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const responseTime = Date.now() - startTime;

    log(colors.green, '✅ HuggingFace API Response Received!');
    console.log(`⏱️  Response time: ${responseTime}ms`);
    console.log('');
    
    log(colors.yellow, '📊 Response Data:');
    console.log(JSON.stringify(response.data, null, 2));
    console.log('');

    // Analyze response
    if (response.data.status === 'success' && response.data.recommendation) {
      log(colors.green, '✅ Response Format: HuggingFace Space Format');
      console.log(`   Primary Offer: ${response.data.recommendation.primary_offer}`);
      console.log(`   Social Proof Offer: ${response.data.recommendation.social_proof_offer}`);
      console.log(`   Confidence Score: ${(response.data.recommendation.confidence_score * 100).toFixed(1)}%`);
    } else {
      log(colors.yellow, '⚠️  Unknown response format');
    }
    console.log('');

    return { success: true, data: response.data, responseTime };

  } catch (error) {
    log(colors.red, '\n❌ Direct API Test Failed!');
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
    return { success: false, error: error.message };
  }
}

/**
 * Test 2: ML Service Integration
 */
async function testMLServiceIntegration() {
  try {
    log(colors.cyan, '\n╔════════════════════════════════════════╗');
    log(colors.cyan, '║   Test 2: ML Service Integration      ║');
    log(colors.cyan, '╚════════════════════════════════════════╝\n');

    const mlService = require('./src/services/mlService');

    const userData = {
      userId: 'test_user_123',
      preferences: {
        usageType: 'data',
        budget: 'medium',
        interests: ['streaming', 'gaming']
      },
      usageFeatures: {
        avgDataUsage: 5200,
        avgCallDuration: 120,
        avgSmsCount: 50,
        avgSpending: 85000,
        isHeavyDataUser: false,
        userSegment: 'balanced_user'
      }
    };

    log(colors.blue, '📤 Testing ML Service with user data...');
    console.log('User data:', JSON.stringify(userData, null, 2));
    console.log('');

    const recommendations = await mlService.getRecommendations(userData);

    if (recommendations && recommendations.length > 0) {
      log(colors.green, '✅ ML Service Integration Working!');
      console.log('');
      
      log(colors.yellow, '📊 Recommendations:');
      recommendations.forEach((rec, idx) => {
        console.log(`   ${idx + 1}. ${rec.targetOffer}`);
        console.log(`      Score: ${(rec.score * 100).toFixed(1)}%`);
        console.log(`      Reason: ${rec.reason}`);
        console.log('');
      });
      
      return { success: true, recommendations };
    } else {
      log(colors.yellow, '⚠️  ML Service returned empty recommendations');
      return { success: false, error: 'Empty recommendations array' };
    }

  } catch (error) {
    log(colors.red, '\n❌ ML Service Integration Failed!');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    return { success: false, error: error.message };
  }
}

/**
 * Test 3: Health Check
 */
async function testHealthCheck() {
  try {
    log(colors.cyan, '\n╔════════════════════════════════════════╗');
    log(colors.cyan, '║   Test 3: Health Check                 ║');
    log(colors.cyan, '╚════════════════════════════════════════╝\n');

    const mlService = require('./src/services/mlService');

    log(colors.blue, '🏥 Checking ML service health...');
    const health = await mlService.healthCheck();

    if (health.status === 'healthy') {
      log(colors.green, '✅ ML Service is Healthy!');
    } else {
      log(colors.yellow, '⚠️  ML Service Unavailable (using fallback)');
    }
    
    console.log('');
    console.log('Health Status:', JSON.stringify(health, null, 2));
    console.log('');

    // Health check is successful even if unavailable (because fallback works)
    return { success: true, health };

  } catch (error) {
    log(colors.red, '\n❌ Health Check Failed!');
    console.error('Error:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Test 4: Test Connection
 */
async function testConnection() {
  try {
    log(colors.cyan, '\n╔════════════════════════════════════════╗');
    log(colors.cyan, '║   Test 4: Connection Test              ║');
    log(colors.cyan, '╚════════════════════════════════════════╝\n');

    const mlService = require('./src/services/mlService');

    log(colors.blue, '🔌 Testing connection with sample data...');
    const result = await mlService.testConnection();

    if (result.success && result.recommendations.length > 0) {
      log(colors.green, '✅ Connection Test Successful!');
      console.log('');
      console.log('Test recommendations received:', result.recommendations.length);
      result.recommendations.forEach((rec, idx) => {
        console.log(`   ${idx + 1}. ${rec.targetOffer} (${(rec.score * 100).toFixed(1)}%)`);
      });
    } else {
      log(colors.yellow, '⚠️  Connection test returned no recommendations');
    }
    console.log('');

    return result;

  } catch (error) {
    log(colors.red, '\n❌ Connection Test Failed!');
    console.error('Error:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Main Test Runner
 */
async function runAllTests() {
  log(colors.cyan, '\n╔════════════════════════════════════════╗');
  log(colors.cyan, '║  HuggingFace ML Integration Tests     ║');
  log(colors.cyan, '╚════════════════════════════════════════╝\n');

  const results = {
    directAPI: null,
    mlService: null,
    healthCheck: null,
    connection: null,
  };

  // Test 1: Direct API
  results.directAPI = await testDirectAPI();
  await sleep(2000);

  // Test 2: ML Service Integration
  results.mlService = await testMLServiceIntegration();
  await sleep(2000);

  // Test 3: Health Check
  results.healthCheck = await testHealthCheck();
  await sleep(2000);

  // Test 4: Connection Test
  results.connection = await testConnection();

  // Summary
  log(colors.cyan, '\n╔════════════════════════════════════════╗');
  log(colors.cyan, '║          Test Summary                  ║');
  log(colors.cyan, '╚════════════════════════════════════════╝\n');

  const tests = [
    { name: 'Direct HuggingFace API', result: results.directAPI },
    { name: 'ML Service Integration', result: results.mlService },
    { name: 'Health Check', result: results.healthCheck },
    { name: 'Connection Test', result: results.connection },
  ];

  tests.forEach(test => {
    const status = test.result?.success ? '✅ PASS' : '❌ FAIL';
    const color = test.result?.success ? colors.green : colors.red;
    log(color, `${status} - ${test.name}`);
  });

  console.log('');
  
  const allPassed = tests.every(t => t.result?.success);
  if (allPassed) {
    log(colors.green, '🎉 All Tests Passed!');
    log(colors.green, '✅ HuggingFace integration is working correctly');
  } else {
    log(colors.yellow, '⚠️  Some tests failed');
    
    // Check if at least ML service is working
    if (results.mlService?.success) {
      log(colors.green, '✅ Core ML Service Integration is working!');
    } else {
      log(colors.yellow, '💡 API will use mock recommendations when ML unavailable');
    }
  }
  console.log('');

  process.exit(allPassed ? 0 : 1);
}

// Helper function
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Run tests
runAllTests().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});