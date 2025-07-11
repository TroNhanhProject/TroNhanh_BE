#!/usr/bin/env node

/**
 * Test Script for UC-Admin User Management APIs
 * This script demonstrates how to test all the admin user management endpoints
 */

const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:5000/api';
const ADMIN_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2ODZiZGI0ZTI2OTBlZmQ0YWQwYjU0ZjUiLCJyb2xlIjoiQWRtaW4iLCJuYW1lIjoiTmd1eeG7hW4gUXVhbmcgSHV5IiwiaWF0IjoxNzUxOTAwNDg0LCJleHAiOjE3NTE5MDEzODR9.ngbL9WQC7PneioJE95tAB-HMfl27j6fV2hf_hMRxI40'; // Replace with actual token

// Helper function to make API calls
const apiCall = async (method, endpoint, data = null, token = ADMIN_TOKEN) => {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    };
    
    if (data) config.data = data;
    
    const response = await axios(config);
    return response.data;
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || error.message
    };
  }
};

// Test functions
const testGetAllUsers = async () => {
  console.log('\n=== UC-Admin-01: Testing Get All Users ===');
  
  // Test basic list
  console.log('1. Basic user list:');
  const result1 = await apiCall('GET', '/admin/users');
  console.log(JSON.stringify(result1, null, 2));
  
  // Test with filters
  console.log('\n2. With filters (customers only):');
  const result2 = await apiCall('GET', '/admin/users?role=customer&limit=5');
  console.log(JSON.stringify(result2, null, 2));
  
  // Test with membership filter
  console.log('\n3. With membership filter (active membership):');
  const result3 = await apiCall('GET', '/admin/users?membership=active&limit=5');
  console.log(JSON.stringify(result3, null, 2));
  
  // Test search
  console.log('\n4. With search:');
  const result4 = await apiCall('GET', '/admin/users?search=test&limit=3');
  console.log(JSON.stringify(result4, null, 2));
};

const testGetUserStats = async () => {
  console.log('\n=== Testing Get User Statistics ===');
  const result = await apiCall('GET', '/admin/users/stats');
  console.log(JSON.stringify(result, null, 2));
};

const testLockUnlockUser = async (userId) => {
  console.log('\n=== UC-Admin-02: Testing Lock/Unlock User ===');
  
  // Test lock user
  console.log('1. Locking user:');
  const lockResult = await apiCall('PUT', `/admin/users/${userId}/lock-unlock`, {
    action: 'lock'
  });
  console.log(JSON.stringify(lockResult, null, 2));
  
  // Test unlock user
  console.log('\n2. Unlocking user:');
  const unlockResult = await apiCall('PUT', `/admin/users/${userId}/lock-unlock`, {
    action: 'unlock'
  });
  console.log(JSON.stringify(unlockResult, null, 2));
  
  // Test invalid action
  console.log('\n3. Testing invalid action:');
  const invalidResult = await apiCall('PUT', `/admin/users/${userId}/lock-unlock`, {
    action: 'invalid'
  });
  console.log(JSON.stringify(invalidResult, null, 2));
};

const testEditUserInfo = async (userId) => {
  console.log('\n=== UC-Admin-03: Testing Edit User Information ===');
  
  // Test valid edit
  console.log('1. Editing user info:');
  const editResult = await apiCall('PUT', `/admin/users/${userId}/edit`, {
    name: 'Updated Name',
    phone: '9999999999'
  });
  console.log(JSON.stringify(editResult, null, 2));
  
  // Test editing membership status
  console.log('\n2. Editing membership status:');
  const membershipResult = await apiCall('PUT', `/admin/users/${userId}/edit`, {
    isMembership: 'active'
  });
  console.log(JSON.stringify(membershipResult, null, 2));
  
  // Test duplicate email
  console.log('\n3. Testing duplicate email:');
  const duplicateResult = await apiCall('PUT', `/admin/users/${userId}/edit`, {
    email: 'existing@example.com' // Should be an existing email
  });
  console.log(JSON.stringify(duplicateResult, null, 2));
  
  // Test invalid email format
  console.log('\n4. Testing invalid email:');
  const invalidEmailResult = await apiCall('PUT', `/admin/users/${userId}/edit`, {
    email: 'invalid-email'
  });
  console.log(JSON.stringify(invalidEmailResult, null, 2));
  
  // Test invalid membership
  console.log('\n5. Testing invalid membership:');
  const invalidMembershipResult = await apiCall('PUT', `/admin/users/${userId}/edit`, {
    isMembership: 'invalid'
  });
  console.log(JSON.stringify(invalidMembershipResult, null, 2));
};

const testDeleteUser = async (userId) => {
  console.log('\n=== UC-Admin-04: Testing Delete User ===');
  
  // Test without confirmation
  console.log('1. Delete without confirmation:');
  const noConfirmResult = await apiCall('DELETE', `/admin/users/${userId}`, {});
  console.log(JSON.stringify(noConfirmResult, null, 2));
  
  // Test with wrong confirmation
  console.log('\n2. Delete with wrong confirmation:');
  const wrongConfirmResult = await apiCall('DELETE', `/admin/users/${userId}`, {
    confirm: 'WRONG'
  });
  console.log(JSON.stringify(wrongConfirmResult, null, 2));
  
  // Test correct deletion (commented out to avoid actual deletion)
  /*
  console.log('\n3. Correct deletion:');
  const deleteResult = await apiCall('DELETE', `/admin/users/${userId}`, {
    confirm: 'DELETE'
  });
  console.log(JSON.stringify(deleteResult, null, 2));
  */
};

const testGetAuditLogs = async () => {
  console.log('\n=== Testing Get Audit Logs ===');
  const result = await apiCall('GET', '/admin/audit-logs?limit=5');
  console.log(JSON.stringify(result, null, 2));
};

const testGetUserById = async (userId) => {
  console.log('\n=== Testing Get User By ID ===');
  const result = await apiCall('GET', `/admin/users/${userId}`);
  console.log(JSON.stringify(result, null, 2));
};

// Main test function
const runTests = async () => {
  console.log('Starting UC-Admin User Management API Tests...');
  console.log('Base URL:', BASE_URL);
  console.log('Using token:', ADMIN_TOKEN ? 'Provided' : 'NOT PROVIDED - Please set ADMIN_TOKEN');
  
  if (!ADMIN_TOKEN || ADMIN_TOKEN === 'YOUR_ADMIN_JWT_TOKEN_HERE') {
    console.log('\n❌ Please set a valid admin JWT token in ADMIN_TOKEN variable');
    return;
  }
  
  try {
    // Get a user ID for testing (from the first user in the list)
    const users = await apiCall('GET', '/admin/users?limit=1');
    const testUserId = users.data?.users[0]?._id;
    
    if (!testUserId) {
      console.log('\n❌ No users found to test with. Please create some users first.');
      return;
    }
    
    console.log(`\n📝 Using test user ID: ${testUserId}`);
    
    // Run all tests
    await testGetAllUsers();
    await testGetUserStats();
    await testGetUserById(testUserId);
    await testLockUnlockUser(testUserId);
    await testEditUserInfo(testUserId);
    await testDeleteUser(testUserId);
    await testGetAuditLogs();
    
    console.log('\n✅ All tests completed!');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
  }
};

// Run tests if this script is executed directly
if (require.main === module) {
  runTests();
}

module.exports = {
  runTests,
  testGetAllUsers,
  testGetUserStats,
  testLockUnlockUser,
  testEditUserInfo,
  testDeleteUser,
  testGetAuditLogs,
  testGetUserById
};
