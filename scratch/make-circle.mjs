import sharp from 'sharp';
import path from 'path';

const pfpPath = path.join(process.cwd(), 'public', 'img', 'pfp.jpg');
const outputPath = path.join(process.cwd(), 'public', 'img', 'pfp-circle.png');

async function generateCircle() {
    try {
        const image = sharp(pfpPath);
        const metadata = await image.metadata();
        const size = Math.min(metadata.width, metadata.height);

        await sharp(pfpPath)
            .resize(size, size)
            .composite([{
                input: Buffer.from(
                    `<svg><circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" /></svg>`
                ),
                blend: 'dest-in'
            }])
            .png()
            .toFile(outputPath);
        
        console.log('Circular pfp generated at ' + outputPath);
    } catch (err) {
        console.error('Error generating circular pfp:', err);
    }
}

generateCircle();
