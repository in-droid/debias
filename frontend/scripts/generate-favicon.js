const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function generateFavicon() {
  try {
    const inputPath = path.join(__dirname, '../public/logo-black.png');
    const outputPath = path.join(__dirname, '../public/favicon.ico');

    // Create favicon.ico with multiple sizes
    await sharp(inputPath)
      .resize(32, 32)
      .toFile(outputPath);

    console.log('Favicon generated successfully!');
  } catch (error) {
    console.error('Error generating favicon:', error);
  }
}

generateFavicon(); 