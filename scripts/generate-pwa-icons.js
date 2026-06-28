const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const inputPath = path.join(__dirname, '../public/mediahive-icon.png');
const outDir = path.join(__dirname, '../public/icons');

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

async function generate() {
  const bg = { r: 17, g: 17, b: 17, alpha: 1 }; // #111111
  
  // Create 192x192
  await sharp(inputPath)
    .resize(192, 192, { fit: 'contain', background: bg })
    .flatten({ background: bg })
    .toFile(path.join(outDir, 'icon-192x192.png'));
    
  // Create 512x512
  await sharp(inputPath)
    .resize(512, 512, { fit: 'contain', background: bg })
    .flatten({ background: bg })
    .toFile(path.join(outDir, 'icon-512x512.png'));
    
  // Create 180x180 for Apple
  await sharp(inputPath)
    .resize(180, 180, { fit: 'contain', background: bg })
    .flatten({ background: bg })
    .toFile(path.join(outDir, 'apple-touch-icon.png'));
    
  console.log('Icons generated successfully.');
}

generate().catch(console.error);
