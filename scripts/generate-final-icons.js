import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const inputFile = process.argv[2];
const publicDir = path.join(process.cwd(), 'public');

const sizes = [
  { name: 'icon-1024x1024.png', size: 1024 },
  { name: 'pwa-512x512.png', size: 512 },
  { name: 'pwa-192x192.png', size: 192 },
  { name: 'apple-touch-icon.png', size: 180 },
  { name: 'favicon.png', size: 48 },
];

async function generateIcons() {
  try {
    for (const { name, size } of sizes) {
      await sharp(inputFile)
        .resize(size, size, { 
          fit: 'contain',
          background: { r: 249, g: 248, b: 246, alpha: 1 } // Using an off-white color that matches the provided logo background roughly
        })
        .png()
        .toFile(path.join(publicDir, name));
      console.log(`Generated ${name}`);
    }
  } catch (error) {
    console.error('Error generating icons:', error);
    process.exit(1);
  }
}

generateIcons();
