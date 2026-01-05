const https = require('https');

console.log('Checking connectivity to firestore.googleapis.com...');

const req = https.get('https://firestore.googleapis.com', (res) => {
    console.log(`STATUS: ${res.statusCode}`);
    console.log('Connectivity OK.');
});

req.on('error', (e) => {
    console.error(`PROBLEM WITH REQUEST: ${e.message}`);
});

req.end();
