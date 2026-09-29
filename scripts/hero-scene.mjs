// Cut the home hero still into the files <HeroScene> serves:
// landscape widths for srcset, and a centred 3:4 crop for portrait screens,
// each as AVIF with a WebP fallback. Re-run after replacing the PNG.
//   node scripts/hero-scene.mjs
import sharp from "sharp";

const SRC = "public/scenes/hero.png";
const OUT = "public/scenes";
const LANDSCAPE = [1080, 1600, 2048];

const { width, height } = await sharp(SRC).metadata();

async function write(name, pipeline) {
  const avif = await pipeline().avif({ quality: 50 }).toFile(`${OUT}/${name}.avif`);
  const webp = await pipeline().webp({ quality: 70 }).toFile(`${OUT}/${name}.webp`);
  console.log(name, `avif ${avif.size}`, `webp ${webp.size}`);
}

for (const w of LANDSCAPE) {
  await write(`hero-${w}`, () => sharp(SRC).resize({ width: w }));
}

const crop = Math.round((height * 3) / 4);
await write(`hero-portrait-${crop}`, () =>
  sharp(SRC).extract({ left: Math.round((width - crop) / 2), top: 0, width: crop, height }),
);
