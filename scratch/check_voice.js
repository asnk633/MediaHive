const fs = require('fs');
const axios = require('axios');
const path = require('path');

async function checkAudio() {
  // Let's download the actual uploaded voice note of 21:32
  const fileId = '1gGN7FIWZSIhC7Hwa7g0l6eAMCvwxhGRv';
  const url = `https://drive.google.com/uc?id=${fileId}&export=download`;
  const destPath = path.join(__dirname, 'voice_download.m4a');
  
  console.log(`Downloading voice note from: ${url}`);
  try {
    const response = await axios({
      method: 'GET',
      url: url,
      responseType: 'stream'
    });
    
    const writer = fs.createWriteStream(destPath);
    response.data.pipe(writer);
    
    await new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });
    
    const stats = fs.statSync(destPath);
    console.log(`File downloaded! Size: ${stats.size} bytes`);
    
    // Read first few bytes to check file header
    const buffer = Buffer.alloc(100);
    const fd = fs.openSync(destPath, 'r');
    fs.readSync(fd, buffer, 0, 100, 0);
    fs.closeSync(fd);
    
    console.log('Hex Header:', buffer.toString('hex', 0, 30));
    console.log('ASCII Header:', buffer.toString('ascii', 0, 30).replace(/[\x00-\x1F\x7F-\xFF]/g, '.'));
    
  } catch (e) {
    console.error('Failed to download audio:', e.message);
  } finally {
    try {
      fs.unlinkSync(destPath);
    } catch (_) {}
  }
}

checkAudio();
