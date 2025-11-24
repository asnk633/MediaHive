const axios = require('axios');

// Create a guest user object similar to what's in the database
const guestUser = {
  id: 3,
  email: 'guest@thaiba.com',
  fullName: 'Guest User',
  role: 'guest',
  institutionId: 1
};

// Create an admin user object
const adminUser = {
  id: 1,
  email: 'admin@thaiba.com',
  fullName: 'Admin User',
  role: 'admin',
  institutionId: 1
};

async function testNotifyEndpoint() {
  try {
    console.log('Testing notify endpoint with guest user...');
    
    // Test with guest user
    const guestResponse = await axios.post('http://localhost:3001/api/notify', {
      title: 'Test Notification',
      message: 'This should be forbidden'
    }, {
      headers: {
        'x-user-data': JSON.stringify(guestUser),
        'content-type': 'application/json'
      }
    });
    
    console.log('Guest user response status:', guestResponse.status);
    console.log('Guest user response data:', guestResponse.data);
  } catch (error) {
    if (error.response) {
      console.log('Guest user response status:', error.response.status);
      console.log('Guest user response data:', error.response.data);
    } else {
      console.log('Error:', error.message);
    }
  }
  
  try {
    console.log('\nTesting notify endpoint with admin user...');
    
    // Test with admin user
    const adminResponse = await axios.post('http://localhost:3001/api/notify', {
      title: 'Test Notification',
      message: 'This should be allowed'
    }, {
      headers: {
        'x-user-data': JSON.stringify(adminUser),
        'content-type': 'application/json'
      }
    });
    
    console.log('Admin user response status:', adminResponse.status);
    console.log('Admin user response data:', adminResponse.data);
  } catch (error) {
    if (error.response) {
      console.log('Admin user response status:', error.response.status);
      console.log('Admin user response data:', error.response.data);
    } else {
      console.log('Error:', error.message);
    }
  }
}

testNotifyEndpoint();