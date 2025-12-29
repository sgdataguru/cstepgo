// Driver Registration Testing Script
// Run this in the browser console on http://localhost:3000/admin/drivers/new
// ✅ FIXED: Text visibility issue - all input fields now have black text (#000000)
// Note: No authentication required - public registration with auto-approval

console.log('🧪 Driver Registration Workflow Test Suite');
console.log('==========================================');
console.log('✅ Changes Applied:');
console.log('   - Removed admin authentication requirement');
console.log('   - Auto-approve all driver registrations');
console.log('   - Admin can still view driver list (with auth)');
console.log('');

// Test data for different scenarios
const testData = {
  validDriver: {
    fullName: 'Test Driver One',
    phone: '+77012345001',
    email: 'driver1@test.com',
    nationalId: '123456789001',
    vehicleMake: 'Toyota',
    vehicleModel: 'Camry',
    licensePlate: 'ABC001'
  },
  duplicatePhone: {
    fullName: 'Test Driver Two',
    phone: '+77012345001', // Same phone as above
    email: 'driver2@test.com',
    nationalId: '123456789002',
    vehicleMake: 'Honda',
    vehicleModel: 'Accord',
    licensePlate: 'ABC002'
  },
  duplicatePlate: {
    fullName: 'Test Driver Three',
    phone: '+77012345003',
    email: 'driver3@test.com',
    nationalId: '123456789003',
    vehicleMake: 'Nissan',
    vehicleModel: 'Altima',
    licensePlate: 'ABC001' // Same plate as first driver
  },
  invalidData: {
    fullName: '',
    phone: 'invalid',
    email: 'invalid-email',
    nationalId: '',
    vehicleMake: '',
    vehicleModel: '',
    licensePlate: ''
  }
};

// Helper function to fill form fields
function fillForm(data) {
  console.log('📝 Filling form with data:', data);

  // Personal Information
  const fullNameInput = document.querySelector('input[placeholder*="Damir Amangeldy"]');
  if (fullNameInput) {
    fullNameInput.value = data.fullName;
    fullNameInput.dispatchEvent(new Event('input', { bubbles: true }));
    console.log('✅ Full name filled');
  }

  const phoneInput = document.querySelector('input[placeholder*="+7 701"]');
  if (phoneInput) {
    phoneInput.value = data.phone;
    phoneInput.dispatchEvent(new Event('input', { bubbles: true }));
    console.log('✅ Phone filled');
  }

  const emailInput = document.querySelector('input[type="email"]');
  if (emailInput && data.email) {
    emailInput.value = data.email;
    emailInput.dispatchEvent(new Event('input', { bubbles: true }));
    console.log('✅ Email filled');
  }

  const nationalIdInput = document.querySelector('input[placeholder*="Government ID"]');
  if (nationalIdInput) {
    nationalIdInput.value = data.nationalId;
    nationalIdInput.dispatchEvent(new Event('input', { bubbles: true }));
    console.log('✅ National ID filled');
  }

  // Vehicle Information
  const vehicleMakeInput = document.querySelector('input[placeholder*="Toyota"]');
  if (vehicleMakeInput) {
    vehicleMakeInput.value = data.vehicleMake;
    vehicleMakeInput.dispatchEvent(new Event('input', { bubbles: true }));
    console.log('✅ Vehicle make filled');
  }

  const vehicleModelInput = document.querySelector('input[placeholder*="Camry"]');
  if (vehicleModelInput) {
    vehicleModelInput.value = data.vehicleModel;
    vehicleModelInput.dispatchEvent(new Event('input', { bubbles: true }));
    console.log('✅ Vehicle model filled');
  }

  const licensePlateInput = document.querySelector('input[placeholder*="A123BCD"]');
  if (licensePlateInput) {
    licensePlateInput.value = data.licensePlate;
    licensePlateInput.dispatchEvent(new Event('input', { bubbles: true }));
    console.log('✅ License plate filled');
  }

  console.log('🎯 Form filled successfully');
}

// Helper function to submit form
function submitForm() {
  console.log('🚀 Submitting form...');
  const submitButton = document.querySelector('button[type="submit"]');
  if (submitButton) {
    submitButton.click();
    console.log('✅ Form submitted');
  } else {
    console.log('❌ Submit button not found');
  }
}

// Helper function to check for errors
function checkErrors() {
  const errorElements = document.querySelectorAll('.text-red-500');
  if (errorElements.length > 0) {
    console.log('❌ Found validation errors:');
    errorElements.forEach((el, index) => {
      console.log(`  ${index + 1}. ${el.textContent}`);
    });
    return true;
  }
  return false;
}

// Helper function to check for success modal
function checkSuccess() {
  const successModal = document.querySelector('[class*="success"]');
  if (successModal) {
    console.log('✅ Success modal appeared!');
    return true;
  }
  return false;
}

// Test functions
window.testDriverRegistration = {
  // Test 1: Form validation with empty fields
  testValidation: function() {
    console.log('\n🧪 Test 1: Form Validation');
    console.log('-------------------------');
    fillForm(testData.invalidData);
    setTimeout(() => {
      submitForm();
      setTimeout(() => {
        if (checkErrors()) {
          console.log('✅ Validation working correctly');
        } else {
          console.log('❌ Validation not working');
        }
      }, 1000);
    }, 500);
  },

  // Test 2: Successful registration
  testSuccessfulRegistration: function() {
    console.log('\n🧪 Test 2: Successful Registration');
    console.log('---------------------------------');
    fillForm(testData.validDriver);
    setTimeout(() => {
      submitForm();
      setTimeout(() => {
        if (checkSuccess()) {
          console.log('✅ Registration successful!');
        } else if (checkErrors()) {
          console.log('❌ Registration failed with errors');
        } else {
          console.log('⏳ Waiting for response...');
        }
      }, 3000);
    }, 500);
  },

  // Test 3: Duplicate phone number
  testDuplicatePhone: function() {
    console.log('\n🧪 Test 3: Duplicate Phone Number');
    console.log('--------------------------------');
    fillForm(testData.duplicatePhone);
    setTimeout(() => {
      submitForm();
      setTimeout(() => {
        const errorAlert = document.querySelector('.bg-red-50');
        if (errorAlert && errorAlert.textContent.includes('Phone number already registered')) {
          console.log('✅ Duplicate phone validation working');
        } else {
          console.log('❌ Duplicate phone validation not working');
        }
      }, 3000);
    }, 500);
  },

  // Test 4: Duplicate license plate
  testDuplicatePlate: function() {
    console.log('\n🧪 Test 4: Duplicate License Plate');
    console.log('---------------------------------');
    fillForm(testData.duplicatePlate);
    setTimeout(() => {
      submitForm();
      setTimeout(() => {
        const errorAlert = document.querySelector('.bg-red-50');
        if (errorAlert && errorAlert.textContent.includes('License plate already registered')) {
          console.log('✅ Duplicate plate validation working');
        } else {
          console.log('❌ Duplicate plate validation not working');
        }
      }, 3000);
    }, 500);
  },

  // Test 5: Check success modal details
  testSuccessModal: function() {
    console.log('\n🧪 Test 5: Success Modal Details');
    console.log('-------------------------------');
    const modal = document.querySelector('[class*="modal"]') || document.querySelector('[role="dialog"]');
    if (modal) {
      const driverId = modal.querySelector('[class*="driver-id"]') || modal.querySelector('code');
      const password = modal.querySelector('[type="password"]') || modal.querySelector('[class*="password"]');
      const copyButtons = modal.querySelectorAll('button[class*="copy"]');
      const statusBadge = modal.querySelector('[class*="bg-green-100"]'); // Now green for APPROVED
      
      console.log('Driver ID:', driverId ? driverId.textContent : 'Not found');
      console.log('Password field:', password ? 'Present' : 'Not found');
      console.log('Copy buttons:', copyButtons.length);
      console.log('Status badge:', statusBadge ? 'APPROVED (green)' : 'Not found');
      
      if (driverId && password && copyButtons.length >= 3 && statusBadge) {
        console.log('✅ Success modal complete - Driver auto-approved!');
        return true;
      } else {
        console.log('❌ Success modal incomplete');
        return false;
      }
    } else {
      console.log('❌ Success modal not found');
      return false;
    }
  },

  runAllTests: function() {
    console.log('\n🚀 Running Complete Test Suite');
    console.log('==============================');

    // Test 1: Validation
    this.testValidation();

    // Wait and then test successful registration
    setTimeout(() => {
      console.log('\n⏳ Moving to successful registration test...');
      this.testSuccessfulRegistration();

      // Wait and then test duplicates
      setTimeout(() => {
        console.log('\n⏳ Moving to duplicate phone test...');
        this.testDuplicatePhone();

        setTimeout(() => {
          console.log('\n⏳ Moving to duplicate plate test...');
          this.testDuplicatePlate();

          setTimeout(() => {
            console.log('\n⏳ Checking success modal...');
            this.testSuccessModal();

            setTimeout(() => {
              console.log('\n⏳ Checking text visibility...');
              this.testTextVisibility();

              console.log('\n✅ Test suite completed!');
              console.log('📋 Summary: Check the results above');
            }, 1000);
          }, 4000);
        }, 4000);
      }, 4000);
    }, 2000);
  },

  // Test 6: Verify text visibility fix
  testTextVisibility: function() {
    console.log('\n🧪 Test 6: Text Visibility Fix');
    console.log('------------------------------');
    
    const inputs = document.querySelectorAll('input[type="text"], input[type="email"], input[type="tel"], input[type="number"], select');
    let allBlack = true;
    
    inputs.forEach((input, index) => {
      const computedStyle = window.getComputedStyle(input);
      const textColor = computedStyle.color;
      
      console.log(`Input ${index + 1} (${input.type || input.tagName.toLowerCase()}): ${textColor}`);
      
      // Check if color is black or very dark
      if (textColor !== 'rgb(0, 0, 0)' && textColor !== '#000000' && textColor !== 'black') {
        console.log(`❌ Input ${index + 1} has non-black text: ${textColor}`);
        allBlack = false;
      }
    });
    
    if (allBlack && inputs.length > 0) {
      console.log('✅ All input fields have black text for visibility!');
    } else {
      console.log('❌ Some input fields still have white/invisible text');
    }
    
    return allBlack;
  }
};

console.log('\n📋 Available test functions:');
console.log('  testDriverRegistration.testValidation() - Test form validation');
console.log('  testDriverRegistration.testSuccessfulRegistration() - Test auto-approved registration');
console.log('  testDriverRegistration.testDuplicatePhone() - Test duplicate phone validation');
console.log('  testDriverRegistration.testDuplicatePlate() - Test duplicate plate validation');
console.log('  testDriverRegistration.testSuccessModal() - Check success modal with APPROVED status');
console.log('  testDriverRegistration.testTextVisibility() - Verify text visibility fix');
console.log('  testDriverRegistration.runAllTests() - Run complete test suite');
console.log('\n💡 Changes: No authentication required - public registration with auto-approval!');
console.log('🎨 FIXED: All input fields now have black text for maximum visibility!');
console.log('🔐 Admin driver list still requires authentication at /admin/drivers');