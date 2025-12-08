const http = require('http');

// Test accessing the home page
const options = {
  hostname: '127.0.0.1',
  port: 3001,
  path: '/home',
  method: 'GET',
  headers: {
    'Accept-Encoding': 'identity' // Disable compression
  }
};

const req = http.request(options, (res) => {
  console.log(`Status Code: ${res.statusCode}`);
  
  res.on('data', (chunk) => {
    console.log(`Body: ${chunk}`);
  });
  
  res.on('end', () => {
    console.log('Request completed');
  });
});

req.on('error', (error) => {
  console.error('Error:', error);
});

req.end();