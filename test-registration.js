// Manual Test Script for Activity Owner Registration
// Open browser console and run these commands to test the flow

console.log('🧪 Testing Activity Owner Registration Flow');

// Test Step 1: Business Information
const testStep1 = () => {
    console.log('📝 Testing Step 1: Business Information');
    
    // Fill business name
    const businessName = document.querySelector('input[placeholder*="Almaty Adventures"]');
    if (businessName) {
        businessName.value = 'Test Adventure Tours';
        businessName.dispatchEvent(new Event('input', { bubbles: true }));
        console.log('✅ Business name filled');
    }
    
    // Fill business description
    const description = document.querySelector('textarea[placeholder*="Describe your business"]');
    if (description) {
        description.value = 'We offer exciting mountain adventures including horseback riding, hiking, and cultural experiences in the Almaty region.';
        description.dispatchEvent(new Event('input', { bubbles: true }));
        console.log('✅ Business description filled');
    }
    
    // Fill contact person
    const contactPerson = document.querySelector('input[placeholder*="Full name"]');
    if (contactPerson) {
        contactPerson.value = 'Askar Nazarbayev';
        contactPerson.dispatchEvent(new Event('input', { bubbles: true }));
        console.log('✅ Contact person filled');
    }
    
    // Fill email
    const email = document.querySelector('input[type="email"]');
    if (email) {
        email.value = 'askar@testadventures.kz';
        email.dispatchEvent(new Event('input', { bubbles: true }));
        console.log('✅ Email filled');
    }
    
    // Fill phone
    const phone = document.querySelector('input[type="tel"]');
    if (phone) {
        phone.value = '+7 777 123 4567';
        phone.dispatchEvent(new Event('input', { bubbles: true }));
        console.log('✅ Phone filled');
    }
    
    console.log('🎯 Step 1 test data filled. Click Continue to proceed.');
};

// Test Step 2: Activity Categories
const testStep2 = () => {
    console.log('📝 Testing Step 2: Activity Categories');
    
    // Select some primary categories
    const categoryCards = document.querySelectorAll('[class*="cursor-pointer"][class*="border-2"]');
    if (categoryCards.length > 0) {
        // Click first few categories
        categoryCards[0]?.click(); // Adventure Sports
        categoryCards[2]?.click(); // Cultural Traditional
        console.log('✅ Primary categories selected');
    }
    
    console.log('🎯 Step 2 categories selected. Click Continue to proceed.');
};

// Test Step 3: Location & Contact
const testStep3 = () => {
    console.log('📝 Testing Step 3: Location & Contact');
    
    const inputs = document.querySelectorAll('input');
    inputs.forEach(input => {
        if (input.placeholder?.includes('Kazakhstan')) {
            input.value = 'Kazakhstan';
            input.dispatchEvent(new Event('input', { bubbles: true }));
        } else if (input.placeholder?.includes('Almaty')) {
            input.value = 'Almaty';
            input.dispatchEvent(new Event('input', { bubbles: true }));
        } else if (input.placeholder?.includes('Street')) {
            input.value = 'Dostyk Ave 123, Almaty 050000';
            input.dispatchEvent(new Event('input', { bubbles: true }));
        }
    });
    
    console.log('✅ Location details filled');
    console.log('🎯 Step 3 location filled. Click Continue to proceed.');
};

// Test Step 4: Document Upload
const testStep4 = () => {
    console.log('📝 Testing Step 4: Document Upload');
    console.log('📄 Document upload simulation - would upload files here');
    console.log('🎯 Step 4 ready. Click Continue to proceed.');
};

// Test Step 5: Final Verification
const testStep5 = () => {
    console.log('📝 Testing Step 5: Final Verification');
    
    const termsCheckbox = document.querySelector('#terms');
    if (termsCheckbox) {
        termsCheckbox.checked = true;
        termsCheckbox.dispatchEvent(new Event('change', { bubbles: true }));
        console.log('✅ Terms accepted');
    }
    
    console.log('🎯 Step 5 ready. Click Submit Application to complete!');
};

// Test complete flow
const testCompleteFlow = () => {
    console.log('🚀 Starting complete registration test...');
    
    // Wait for each step and auto-advance
    const advanceStep = (stepNum, testFunc) => {
        setTimeout(() => {
            console.log(`\n=== STEP ${stepNum} ===`);
            testFunc();
            
            // Click continue button after filling data
            setTimeout(() => {
                const continueBtn = document.querySelector('button:contains("Continue"), button:contains("Submit Application")');
                if (continueBtn) {
                    continueBtn.click();
                    console.log(`⏭️ Advanced to next step`);
                }
            }, 1000);
        }, stepNum * 2000);
    };
    
    advanceStep(1, testStep1);
    advanceStep(2, testStep2);
    advanceStep(3, testStep3);
    advanceStep(4, testStep4);
    advanceStep(5, testStep5);
};

// Export test functions to window for manual use
window.testRegistration = {
    step1: testStep1,
    step2: testStep2,
    step3: testStep3,
    step4: testStep4,
    step5: testStep5,
    complete: testCompleteFlow
};

console.log(`
🧪 Registration Test Suite Ready!

Manual testing:
- testRegistration.step1() - Fill Step 1 data
- testRegistration.step2() - Select categories  
- testRegistration.step3() - Fill location
- testRegistration.step4() - Document upload
- testRegistration.step5() - Accept terms
- testRegistration.complete() - Run full flow

Or just open browser dev tools and run individual step functions.
`);

export {};
