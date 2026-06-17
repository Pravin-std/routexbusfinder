import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const inputFile = path.join(process.cwd(), 'public', 'routex-logo.jpg');
const publicDir = path.join(process.cwd(), 'public');

const sizes = [
  { name: 'pwa-192x192.png', size: 192 },
  { name: 'pwa-512x512.png', size: 512 },
  { name: 'apple-touch-icon.png', size: 180 }, // standard apple touch icon size
];

async function generateIcons() {
  try {
    for (const { name, size } of sizes) {
      await sharp(inputFile)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 1 }
        })
        .png()
        .toFile(path.join(publicDir, name));
      console.log(`Generated ${name}`);
    }
  } catch (error) {
    console.error('Error generating icons:', error);
  }
}

generateIcons();
