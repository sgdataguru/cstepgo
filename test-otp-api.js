/**
 * OTP Authentication API Tests
 * Run with: node test-otp-api.js
 */

const BASE_URL = 'http://localhost:3000';

// Test data
const testContact = {
  email: 'test@example.com',
  phone: '+77001234567',
};

// Utility function to make API requests
async function apiRequest(endpoint, method = 'POST', body = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, options);
  const data = await response.json();

  return {
    status: response.status,
    ok: response.ok,
    data,
  };
}

// Test 1: Send OTP via Email
async function testSendOTPEmail() {
  console.log('\n📧 Test 1: Send OTP via Email');
  console.log('=' .repeat(50));

  const result = await apiRequest('/api/auth/send-otp', 'POST', {
    contact: testContact.email,
    type: 'email',
  });

  console.log('Status:', result.status);
  console.log('Success:', result.data.success);
  console.log('Message:', result.data.message);

  if (result.data.success) {
    console.log('✅ OTP sent successfully');
    console.log('Check server console for OTP code');
  } else {
    console.log('❌ Failed:', result.data.error);
  }

  return result.data.success;
}

// Test 2: Send OTP via SMS
async function testSendOTPSMS() {
  console.log('\n📱 Test 2: Send OTP via SMS');
  console.log('='.repeat(50));

  const result = await apiRequest('/api/auth/send-otp', 'POST', {
    contact: testContact.phone,
    type: 'sms',
  });

  console.log('Status:', result.status);
  console.log('Success:', result.data.success);
  console.log('Message:', result.data.message);

  if (result.data.success) {
    console.log('✅ OTP sent successfully');
    console.log('Check server console for OTP code');
  } else {
    console.log('❌ Failed:', result.data.error);
  }

  return result.data.success;
}

// Test 3: Verify OTP (with mock code)
async function testVerifyOTP(contact, type, code) {
  console.log('\n🔑 Test 3: Verify OTP');
  console.log('='.repeat(50));

  const result = await apiRequest('/api/auth/verify-otp', 'POST', {
    contact,
    code,
    type,
  });

  console.log('Status:', result.status);
  console.log('Success:', result.data.success);
  console.log('Message:', result.data.message);

  if (result.data.success) {
    console.log('✅ OTP verified successfully');
  } else {
    console.log('❌ Failed:', result.data.error);
  }

  return result.data.success;
}

// Test 4: Complete Registration
async function testRegister(contact, type) {
  console.log('\n👤 Test 4: Complete Registration');
  console.log('='.repeat(50));

  const result = await apiRequest('/api/auth/register', 'POST', {
    contact,
    type,
    name: 'Test User',
    preferredLanguage: 'en',
  });

  console.log('Status:', result.status);
  console.log('Success:', result.data.success);

  if (result.data.success) {
    console.log('✅ Registration completed successfully');
    console.log('User ID:', result.data.data.user.id);
    console.log('Session Token:', result.data.data.session.token.substring(0, 20) + '...');
  } else {
    console.log('❌ Failed:', result.data.error);
  }

  return result.data.success;
}

// Test 5: Rate Limiting
async function testRateLimiting() {
  console.log('\n⏱️  Test 5: Rate Limiting');
  console.log('='.repeat(50));

  console.log('Attempting to send OTP 4 times rapidly...');

  for (let i = 1; i <= 4; i++) {
    const result = await apiRequest('/api/auth/send-otp', 'POST', {
      contact: 'ratelimit@test.com',
      type: 'email',
    });

    console.log(`Attempt ${i}:`, result.status, result.data.success ? '✅' : '❌');

    if (result.status === 429) {
      console.log('✅ Rate limiting working correctly');
      return true;
    }
  }

  console.log('⚠️  Rate limiting not triggered (might need adjustment)');
  return false;
}

// Run all tests
async function runTests() {
  console.log('\n🚀 Starting OTP Authentication API Tests');
  console.log('='.repeat(50));
  console.log('Server:', BASE_URL);
  console.log('Time:', new Date().toISOString());

  try {
    // Test sending OTP
    await testSendOTPEmail();
    await new Promise(resolve => setTimeout(resolve, 1000));

    await testSendOTPSMS();
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Note: In a real test, you'd need to retrieve the OTP from console
    // For demo purposes, we'll show the flow
    console.log('\n📝 Note: To complete verification and registration tests,');
    console.log('   you need to check the server console for OTP codes');
    console.log('   and update the test with actual codes.');

    // Test rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
    await testRateLimiting();

    console.log('\n✅ All tests completed');
    console.log('='.repeat(50));
  } catch (error) {
    console.error('\n❌ Test suite failed:', error);
  }
}

// Run tests if this is the main module
if (require.main === module) {
  runTests();
}

module.exports = {
  testSendOTPEmail,
  testSendOTPSMS,
  testVerifyOTP,
  testRegister,
  testRateLimiting,
};
