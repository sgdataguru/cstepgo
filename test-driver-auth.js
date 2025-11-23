// Test script for driver authentication APIs
const testData = {
  driverRegistration: {
    name: "Test Driver",
    email: "testdriver@example.com", 
    phone: "+77771234567",
    vehicleMake: "Toyota",
    vehicleModel: "Camry",
    vehicleYear: 2020,
    licensePlate: "123ABC01",
    vehicleColor: "Blue",
    passengerCapacity: 4,
    licenseNumber: "KZ123456789",
    licenseExpiry: "2025-12-31",
    serviceRadiusKm: 25,
    willingToTravel: ["domestic"],
    bio: "Experienced driver with 5 years of professional driving.",
    yearsExperience: 5,
    languages: [
      {
        code: "kk",
        name: "Kazakh",
        proficiency: "native"
      },
      {
        code: "ru",
        name: "Russian",
        proficiency: "fluent"
      },
      {
        code: "en",
        name: "English", 
        proficiency: "intermediate"
      }
    ],
    acceptsTerms: true,
    acceptsDataProcessing: true
  }
};

// Function to test driver registration
async function testDriverRegistration() {
  console.log('Testing driver registration...');
  
  try {
    const response = await fetch('http://localhost:3000/api/drivers/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testData.driverRegistration)
    });
    
    const result = await response.json();
    console.log('Registration response:', result);
    
    if (response.ok) {
      console.log('✅ Driver registration successful');
      return result.data;
    } else {
      console.log('❌ Driver registration failed:', result.error);
      return null;
    }
  } catch (error) {
    console.log('❌ Registration request failed:', error.message);
    return null;
  }
}

// Function to test driver login
async function testDriverLogin(email = "testdriver@example.com", password = "temppass123") {
  console.log('Testing driver login...');
  
  try {
    const response = await fetch('http://localhost:3000/api/drivers/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: email,
        password: password,
        remember: false
      })
    });
    
    const result = await response.json();
    console.log('Login response:', result);
    
    if (response.ok) {
      console.log('✅ Driver login successful');
      return result.session.token;
    } else {
      console.log('❌ Driver login failed:', result.error);
      return null;
    }
  } catch (error) {
    console.log('❌ Login request failed:', error.message);
    return null;
  }
}

// Function to test document upload
async function testDocumentUpload(driverId) {
  console.log('Testing document upload...');
  
  const documentData = {
    documentType: 'drivers_license',
    fileName: 'drivers_license.pdf',
    fileSize: 1024576,
    mimeType: 'application/pdf',
    fileUrl: 'https://example.com/documents/drivers_license.pdf',
    description: 'Drivers license copy',
    expiryDate: '2025-12-31'
  };
  
  try {
    const response = await fetch('http://localhost:3000/api/drivers/documents', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Driver-Id': driverId
      },
      body: JSON.stringify(documentData)
    });
    
    const result = await response.json();
    console.log('Document upload response:', result);
    
    if (response.ok) {
      console.log('✅ Document upload successful');
      return true;
    } else {
      console.log('❌ Document upload failed:', result.error);
      return false;
    }
  } catch (error) {
    console.log('❌ Document upload request failed:', error.message);
    return false;
  }
}

// Function to test driver profile retrieval
async function testDriverProfile(driverId) {
  console.log('Testing driver profile retrieval...');
  
  try {
    const response = await fetch('http://localhost:3000/api/drivers/profile', {
      method: 'GET',
      headers: {
        'X-Driver-Id': driverId
      }
    });
    
    const result = await response.json();
    console.log('Profile response:', result);
    
    if (response.ok) {
      console.log('✅ Driver profile retrieval successful');
      return result.data;
    } else {
      console.log('❌ Driver profile retrieval failed:', result.error);
      return null;
    }
  } catch (error) {
    console.log('❌ Profile request failed:', error.message);
    return null;
  }
}

// Main test function
async function runTests() {
  console.log('🚀 Starting Driver Authentication API Tests\n');
  
  // Test 1: Driver Registration
  console.log('--- Test 1: Driver Registration ---');
  const registrationResult = await testDriverRegistration();
  
  if (!registrationResult) {
    console.log('⚠️  Registration failed, stopping tests');
    return;
  }
  
  const driverId = registrationResult.userId; // Use userId as driver identifier for testing
  
  // Test 2: Driver Login (will fail with temp password, but tests API)
  console.log('\n--- Test 2: Driver Login ---');
  const loginToken = await testDriverLogin();
  
  // Test 3: Document Upload
  console.log('\n--- Test 3: Document Upload ---');
  const documentUploadSuccess = await testDocumentUpload(driverId);
  
  // Test 4: Driver Profile
  console.log('\n--- Test 4: Driver Profile ---');
  const profileData = await testDriverProfile(driverId);
  
  // Summary
  console.log('\n🏁 Test Summary:');
  console.log(`Registration: ${registrationResult ? '✅' : '❌'}`);
  console.log(`Login: ${loginToken ? '✅' : '❌'}`);
  console.log(`Document Upload: ${documentUploadSuccess ? '✅' : '❌'}`);
  console.log(`Profile Retrieval: ${profileData ? '✅' : '❌'}`);
  
  console.log('\n📋 Next Steps:');
  console.log('1. Set up proper authentication middleware');
  console.log('2. Implement file upload handling');
  console.log('3. Create driver registration form UI');
  console.log('4. Build driver dashboard components');
  console.log('5. Add admin approval workflow');
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    runTests,
    testDriverRegistration,
    testDriverLogin,
    testDocumentUpload,
    testDriverProfile
  };
}

// Run tests if called directly
if (typeof window === 'undefined' && require.main === module) {
  runTests();
}
