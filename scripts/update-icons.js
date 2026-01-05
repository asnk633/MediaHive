const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Source logo
const sourceLogo = path.join(__dirname, '..', 'public', 'mediahive-icon.png');

// Destination directories for different densities
const destinations = [
  { dir: 'mipmap-mdpi', size: 48 },
  { dir: 'mipmap-hdpi', size: 72 },
  { dir: 'mipmap-xhdpi', size: 96 },
  { dir: 'mipmap-xxhdpi', size: 144 },
  { dir: 'mipmap-xxxhdpi', size: 192 }
];

// Resize and save images
async function resizeImages() {
  try {
    // Check if source logo exists
    if (!fs.existsSync(sourceLogo)) {
      console.error('Source logo not found:', sourceLogo);
      return;
    }

    console.log('Resizing MediaHive logo for different densities...');

    // Process each destination
    for (const dest of destinations) {
      const destDir = path.join(__dirname, '..', 'android', 'app', 'src', 'main', 'res', dest.dir);
      
      // Create directory if it doesn't exist
      if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
      }

      // Resize for ic_launcher.png (adaptive icon background)
      const icLauncherPath = path.join(destDir, 'ic_launcher.png');
      await sharp(sourceLogo)
        .resize(dest.size, dest.size)
        .png()
        .toFile(icLauncherPath);
      
      // Resize for ic_launcher_round.png (round icon)
      const icLauncherRoundPath = path.join(destDir, 'ic_launcher_round.png');
      await sharp(sourceLogo)
        .resize(dest.size, dest.size)
        .png()
        .toFile(icLauncherRoundPath);
      
      // Resize for ic_launcher_foreground.png (adaptive icon foreground)
      const icLauncherForegroundPath = path.join(destDir, 'ic_launcher_foreground.png');
      await sharp(sourceLogo)
        .resize(Math.floor(dest.size * 0.75), Math.floor(dest.size * 0.75)) // Slightly smaller for foreground
        .png()
        .toFile(icLauncherForegroundPath);
      
      console.log(`Generated icons for ${dest.dir}`);
    }

    // Also update the adaptive icon configuration to use the new foreground
    const adaptiveIconPath = path.join(__dirname, '..', 'android', 'app', 'src', 'main', 'res', 'mipmap-anydpi-v26', 'ic_launcher.xml');
    const roundAdaptiveIconPath = path.join(__dirname, '..', 'android', 'app', 'src', 'main', 'res', 'mipmap-anydpi-v26', 'ic_launcher_round.xml');
    
    const adaptiveIconContent = `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/ic_launcher_background"/>
    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>
</adaptive-icon>`;
    
    fs.writeFileSync(adaptiveIconPath, adaptiveIconContent);
    fs.writeFileSync(roundAdaptiveIconPath, adaptiveIconContent);
    
    console.log('Updated adaptive icon configurations');
    console.log('Icon update completed successfully!');
  } catch (error) {
    console.error('Error resizing images:', error);
  }
}

resizeImages();