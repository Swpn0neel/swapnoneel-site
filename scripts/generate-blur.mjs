import fs from "fs/promises";
import path from "path";
import sharp from "sharp";

async function generateBlurMap() {
  const publicDir = path.join(process.cwd(), "public");
  const dirsToScan = ["work", "project", "img"];
  const blurMap = {};

  for (const dir of dirsToScan) {
    const dirPath = path.join(publicDir, dir);
    try {
      const files = await fs.readdir(dirPath);
      for (const file of files) {
        if (!file.match(/\.(png|jpe?g|webp|gif|avif)$/i)) continue;
        const filePath = path.join(dirPath, file);
        const buffer = await fs.readFile(filePath);

        const metadata = await sharp(buffer).metadata();
        const resizeHeight =
          Math.round((metadata.height / metadata.width) * 16) || 16;

        const resized = await sharp(buffer)
          .resize(16, resizeHeight)
          .webp({ quality: 80 })
          .toBuffer();

        const base64 = `data:image/webp;base64,${resized.toString("base64")}`;
        const relativePath = `/${dir}/${file}`;
        blurMap[relativePath] = base64;
      }
    } catch (e) {
      console.log(`Skipping ${dirPath}:`, e.message);
    }
  }

  const outPath = path.join(process.cwd(), "lib", "blur-map.json");
  await fs.writeFile(outPath, JSON.stringify(blurMap, null, 2));
  console.log("Successfully generated lib/blur-map.json");
}

generateBlurMap();
