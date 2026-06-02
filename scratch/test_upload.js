const fs = require('fs');
const path = require('path');

async function testUpload() {
  const uploadUrl = 'https://thaiba-garden-media-manager.vercel.app/api/chat/upload/';
  const mockFilePath = path.join(__dirname, 'mock_voice.txt');
  
  // Create a mock small file
  fs.writeFileSync(mockFilePath, 'This is mock voice note recorded data.');
  
  console.log('Sending mock file upload request to Vercel...');

  const FormData = require('form-data');
  const form = new FormData();
  form.append('roomId', '7bc0bbe7-1943-4929-a769-5fdfbc487446'); // General chat room ID or test ID
  form.append('file', fs.createReadStream(mockFilePath), {
    filename: 'mock_voice.m4a',
    contentType: 'audio/x-m4a'
  });

  const axios = require('axios');
  try {
    const response = await axios.post(uploadUrl, form, {
      headers: form.getHeaders(),
      timeout: 15000
    });
    console.log('Success! Status:', response.status);
    console.log('Response:', response.data);
  } catch (error) {
    console.error('Upload failed!');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Error Message:', error.message);
    }
  } finally {
    // Cleanup
    try {
      fs.unlinkSync(mockFilePath);
    } catch (_) {}
  }
}

testUpload();
