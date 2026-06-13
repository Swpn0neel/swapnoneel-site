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
        const image = sharp(filePath);
        const metadata = await image.metadata();
        const width = metadata.width || 16;
        const height = metadata.height || 16;
        const resizeHeight = Math.max(1, Math.round((height / width) * 16));

        const resized = await image
          .resize(16, resizeHeight)
          .webp({ quality: 70 })
          .toBuffer();

        blurMap[`/${dir}/${file}`] =
          `data:image/webp;base64,${resized.toString("base64")}`;
      }
    } catch (error) {
      console.warn(`Skipping ${dirPath}:`, error.message);
    }
  }

  const outPath = path.join(process.cwd(), "lib", "blur-map.json");
  await fs.writeFile(outPath, `${JSON.stringify(blurMap, null, 2)}\n`);
  console.log("Successfully generated lib/blur-map.json");
}

generateBlurMap().catch((error) => {
  console.error(error);
  process.exit(1);
});
