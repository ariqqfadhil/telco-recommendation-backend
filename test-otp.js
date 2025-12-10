require('dotenv').config();
const axios = require('axios');

const API_URL = process.env.API_URL || 'https://telco-recommendation-backend-production.up.railway.app/';

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

async function testOTPFlow() {
  try {
    log(colors.cyan, '\n╔════════════════════════════════════════╗');
    log(colors.cyan, '║   Testing OTP Authentication Flow     ║');
    log(colors.cyan, '╚════════════════════════════════════════╝\n');

    const testPhone = '081234567890';
    const testName = 'Test User OTP';

    // Step 1: Request OTP
    log(colors.blue, '📤 Step 1: Requesting OTP...');
    const otpResponse = await axios.post(`${API_URL}/api/auth/request-otp`, {
      phoneNumber: testPhone,
      name: testName,
    });

    log(colors.green, '✅ OTP Requested Successfully!');
    console.log('Response:', JSON.stringify(otpResponse.data, null, 2));
    console.log('');

    // Prompt for OTP
    log(colors.yellow, '⚠️  Check your console/terminal for the OTP code');
    log(colors.yellow, '   (In production, it will be sent via SMS)');
    console.log('');

    // For testing, wait and use a mock OTP
    log(colors.blue, '📝 Enter the OTP code from console:');
    log(colors.cyan, '   (For testing, check server console output)');
    console.log('');

    // Simulate waiting for user input
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    readline.question('Enter OTP: ', async (otp) => {
      readline.close();

      // Step 2: Verify OTP
      log(colors.blue, '\n📤 Step 2: Verifying OTP...');
      try {
        const verifyResponse = await axios.post(`${API_URL}/api/auth/verify-otp`, {
          phoneNumber: testPhone,
          otp: otp,
        });

        log(colors.green, '✅ OTP Verified Successfully!');
        console.log('Response:', JSON.stringify(verifyResponse.data, null, 2));
        console.log('');

        // Step 3: Test authenticated request
        const token = verifyResponse.data.data.token;
        log(colors.blue, '📤 Step 3: Testing authenticated request...');

        const profileResponse = await axios.get(`${API_URL}/api/auth/profile`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        log(colors.green, '✅ Authenticated Request Successful!');
        console.log('Profile:', JSON.stringify(profileResponse.data, null, 2));
        console.log('');

        log(colors.green, '\n╔════════════════════════════════════════╗');
        log(colors.green, '║   ✅ All Tests Passed Successfully!   ║');
        log(colors.green, '╚════════════════════════════════════════╝\n');

      } catch (error) {
        log(colors.red, '\n❌ Verification Failed!');
        console.error('Error:', error.response?.data || error.message);
      }
    });

  } catch (error) {
    log(colors.red, '\n❌ Test Failed!');
    console.error('Error:', error.response?.data || error.message);
    process.exit(1);
  }
}

// Test OTP Config endpoint
async function testOTPConfig() {
  try {
    log(colors.blue, '\n📤 Testing OTP Config endpoint...');
    const response = await axios.get(`${API_URL}/api/auth/otp-config`);
    log(colors.green, '✅ OTP Config retrieved!');
    console.log('Config:', JSON.stringify(response.data, null, 2));
    console.log('');
  } catch (error) {
    log(colors.red, '❌ Failed to get OTP config');
    console.error('Error:', error.response?.data || error.message);
  }
}

// Main
async function main() {
  log(colors.cyan, '🚀 Starting OTP Tests...\n');
  
  // First test config
  await testOTPConfig();
  
  // Then test full flow
  await testOTPFlow();
}

main();