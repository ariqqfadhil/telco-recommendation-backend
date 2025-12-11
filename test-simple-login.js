require('dotenv').config();
const axios = require('axios');

const API_URL = process.env.API_URL || 'https://telco-recommendation-backend-production.up.railway.app';

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

async function testSimpleLogin() {
  try {
    log(colors.cyan, '\n╔════════════════════════════════════════╗');
    log(colors.cyan, '║   Testing Simple Login Flow           ║');
    log(colors.cyan, '╚════════════════════════════════════════╝\n');

    const testPhone = '081234567890';
    const testName = 'Test User Simple Login';

    // Step 1: Simple Login
    log(colors.blue, '📤 Step 1: Login with phone number...');
    const loginResponse = await axios.post(`${API_URL}/api/auth/login`, {
      phoneNumber: testPhone,
      name: testName,
    });

    log(colors.green, '✅ Login Successful!');
    console.log('Response:', JSON.stringify(loginResponse.data, null, 2));
    console.log('');

    const token = loginResponse.data.data.token;
    log(colors.blue, `🔑 Token: ${token.substring(0, 50)}...`);
    console.log('');

    // Step 2: Get Profile
    log(colors.blue, '📤 Step 2: Getting user profile...');
    const profileResponse = await axios.get(`${API_URL}/api/auth/profile`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    log(colors.green, '✅ Profile Retrieved!');
    console.log('Profile:', JSON.stringify(profileResponse.data, null, 2));
    console.log('');

    // Step 3: Update Profile
    log(colors.blue, '📤 Step 3: Updating profile...');
    const updateResponse = await axios.put(
      `${API_URL}/api/auth/profile`,
      {
        preferences: {
          usageType: 'data',
          budget: 'high',
          interests: ['streaming', 'gaming'],
        },
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    log(colors.green, '✅ Profile Updated!');
    console.log('Updated Profile:', JSON.stringify(updateResponse.data, null, 2));
    console.log('');

    // Step 4: Get Recommendations
    log(colors.blue, '📤 Step 4: Getting recommendations...');
    const recResponse = await axios.get(`${API_URL}/api/recommendations`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    log(colors.green, '✅ Recommendations Retrieved!');
    console.log('Recommendations:', JSON.stringify(recResponse.data, null, 2));
    console.log('');

    // Step 5: Get Products
    log(colors.blue, '📤 Step 5: Getting products...');
    const productsResponse = await axios.get(`${API_URL}/api/products?limit=5`);

    log(colors.green, '✅ Products Retrieved!');
    console.log(`Total products: ${productsResponse.data.pagination?.total || 'N/A'}`);
    console.log('');

    log(colors.green, '\n╔════════════════════════════════════════╗');
    log(colors.green, '║   ✅ All Tests Passed Successfully!   ║');
    log(colors.green, '╚════════════════════════════════════════╝\n');

    log(colors.yellow, '📊 Summary:');
    log(colors.yellow, `   ✅ Login: OK`);
    log(colors.yellow, `   ✅ Get Profile: OK`);
    log(colors.yellow, `   ✅ Update Profile: OK`);
    log(colors.yellow, `   ✅ Get Recommendations: OK`);
    log(colors.yellow, `   ✅ Get Products: OK`);
    console.log('');

  } catch (error) {
    log(colors.red, '\n❌ Test Failed!');
    console.error('Error:', error.response?.data || error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

// Test check phone endpoint
async function testCheckPhone() {
  try {
    log(colors.blue, '\n📤 Testing Check Phone endpoint...');
    const response = await axios.post(`${API_URL}/api/auth/check-phone`, {
      phoneNumber: '081234567890',
    });
    log(colors.green, '✅ Check Phone OK!');
    console.log('Result:', JSON.stringify(response.data, null, 2));
    console.log('');
  } catch (error) {
    log(colors.red, '❌ Failed to check phone');
    console.error('Error:', error.response?.data || error.message);
  }
}

// Main
async function main() {
  log(colors.cyan, '🚀 Starting Simple Login Tests...\n');
  
  // Test check phone first
  await testCheckPhone();
  
  // Then test full login flow
  await testSimpleLogin();
  
  process.exit(0);
}

main();