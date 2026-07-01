import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const svgPath = path.resolve(__dirname, '../public/favicon.svg');
const publicDir = path.resolve(__dirname, '../public');

if (!fs.existsSync(svgPath)) {
  console.error('Error: public/favicon.svg not found.');
  process.exit(1);
}

const svgBuffer = fs.readFileSync(svgPath);

async function generateIcons() {
  console.log('Generating PWA assets from public/favicon.svg...');
  
  // Standard PWA icons
  await sharp(svgBuffer)
    .resize(192, 192)
    .png()
    .toFile(path.join(publicDir, 'pwa-192x192.png'));
  console.log('✔ Generated pwa-192x192.png');

  await sharp(svgBuffer)
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'pwa-512x512.png'));
  console.log('✔ Generated pwa-512x512.png');

  // Maskable icons (padded and with background)
  // Standard maskable icons need the content inside a safe zone (inner 80% circle).
  // We place the resized logo on a background of #0a0a0a (matching the app's dark theme).
  const padding192 = Math.round(192 * 0.15); // 15% padding on each side
  const innerSize192 = 192 - padding192 * 2;
  const inner192 = await sharp(svgBuffer)
    .resize(innerSize192, innerSize192, { fit: 'contain' })
    .toBuffer();
  
  await sharp({
    create: {
      width: 192,
      height: 192,
      channels: 4,
      background: { r: 10, g: 10, b: 10, alpha: 1 } // #0a0a0a
    }
  })
    .composite([{ input: inner192, gravity: 'center' }])
    .png()
    .toFile(path.join(publicDir, 'pwa-maskable-192x192.png'));
  console.log('✔ Generated pwa-maskable-192x192.png');

  const padding512 = Math.round(512 * 0.15);
  const innerSize512 = 512 - padding512 * 2;
  const inner512 = await sharp(svgBuffer)
    .resize(innerSize512, innerSize512, { fit: 'contain' })
    .toBuffer();

  await sharp({
    create: {
      width: 512,
      height: 512,
      channels: 4,
      background: { r: 10, g: 10, b: 10, alpha: 1 } // #0a0a0a
    }
  })
    .composite([{ input: inner512, gravity: 'center' }])
    .png()
    .toFile(path.join(publicDir, 'pwa-maskable-512x512.png'));
  console.log('✔ Generated pwa-maskable-512x512.png');

  // Apple touch icon (180x180 png)
  const padding180 = Math.round(180 * 0.1);
  const innerSize180 = 180 - padding180 * 2;
  const inner180 = await sharp(svgBuffer)
    .resize(innerSize180, innerSize180, { fit: 'contain' })
    .toBuffer();

  await sharp({
    create: {
      width: 180,
      height: 180,
      channels: 4,
      background: { r: 10, g: 10, b: 10, alpha: 1 } // #0a0a0a
    }
  })
    .composite([{ input: inner180, gravity: 'center' }])
    .png()
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));
  console.log('✔ Generated apple-touch-icon.png');

  console.log('All PWA assets generated successfully!');
}

generateIcons().catch(err => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
