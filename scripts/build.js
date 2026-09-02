import { promises as fs } from "fs";
import path from "path";
import sharp from "sharp";
import { load as loadYaml } from "js-yaml";

const ROOT = process.cwd();
const PHOTOS = path.join(ROOT, "photos");
const CONTENT = path.join(ROOT, "content");
const DIST = path.join(ROOT, "dist");
const DIST_DATA = path.join(DIST, "data");
const DIST_IMAGES = path.join(DIST, "images");

const THUMB_WIDTH = 600;
const FULL_WIDTH = 2000;
const JPEG_QUALITY = 82;

const PORTFOLIO_CATEGORIES = [
  { slug: "concerts", title: "Concerts" },
  { slug: "events", title: "Events" },
  { slug: "fashion", title: "Fashion" },
  { slug: "weddings", title: "Weddings" },
  { slug: "corporate", title: "Corporate" },
];

async function readYaml(file) {
  return loadYaml(await fs.readFile(file, "utf8"));
}

async function writeJson(file, data) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, JSON.stringify(data, null, 2));
}

function toWebPath(absPath) {
  return path.relative(DIST, absPath).split(path.sep).join("/");
}

async function copyDir(src, dest) {
  await fs.mkdir(dest, { recursive: true });
  for (const entry of await fs.readdir(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) await copyDir(s, d);
    else await fs.copyFile(s, d);
  }
}

// Resizes one source photo into a thumb + full-bleed JPEG, returns their web paths.
async function processPhoto(srcPath, destDir, filename) {
  const base = path.parse(filename).name;
  const thumbPath = path.join(destDir, "thumb", `${base}.jpg`);
  const fullPath = path.join(destDir, "full", `${base}.jpg`);

  await fs.mkdir(path.dirname(thumbPath), { recursive: true });
  await fs.mkdir(path.dirname(fullPath), { recursive: true });

  await sharp(srcPath)
    .resize({ width: THUMB_WIDTH, withoutEnlargement: true })
    .jpeg({ quality: JPEG_QUALITY })
    .toFile(thumbPath);

  await sharp(srcPath)
    .resize({ width: FULL_WIDTH, withoutEnlargement: true })
    .jpeg({ quality: JPEG_QUALITY })
    .toFile(fullPath);

  return { thumb: toWebPath(thumbPath), full: toWebPath(fullPath) };
}

async function buildFavorites() {
  const dir = path.join(PHOTOS, "favorites");
  const order = await readYaml(path.join(dir, "order.yml"));
  const photos = [];
  for (const filename of order) {
    const { thumb, full } = await processPhoto(path.join(dir, filename), path.join(DIST_IMAGES, "favorites"), filename);
    photos.push({ src: full, thumb, alt: "" });
  }
  await writeJson(path.join(DIST_DATA, "favorites.json"), photos);
}

async function buildDiary() {
  const slugs = await readYaml(path.join(CONTENT, "diary-index.yml"));
  const index = [];
  for (const slug of slugs) {
    const entryDir = path.join(PHOTOS, "diary", slug);
    const entry = await readYaml(path.join(entryDir, "entry.yml"));
    const order = await readYaml(path.join(entryDir, "order.yml"));

    const photos = [];
    for (const filename of order) {
      const { thumb, full } = await processPhoto(path.join(entryDir, filename), path.join(DIST_IMAGES, "diary", slug), filename);
      photos.push({ src: full, thumb, alt: "" });
    }

    await writeJson(path.join(DIST_DATA, "diary", `${slug}.json`), {
      title: entry.title,
      comment: entry.comment,
      photos,
    });

    const coverFilename = entry.cover_image || order[0];
    const cover = photos[order.indexOf(coverFilename)] || photos[0];
    index.push({ slug, title: entry.title, cover: cover.thumb });
  }
  await writeJson(path.join(DIST_DATA, "diary-index.json"), index);
}

async function buildPortfolio() {
  const index = [];
  for (const category of PORTFOLIO_CATEGORIES) {
    const dir = path.join(PHOTOS, "portfolio", category.slug);
    const order = await readYaml(path.join(dir, "order.yml"));

    const photos = [];
    for (const filename of order) {
      const { thumb, full } = await processPhoto(path.join(dir, filename), path.join(DIST_IMAGES, "portfolio", category.slug), filename);
      photos.push({ src: full, thumb, alt: "" });
    }

    await writeJson(path.join(DIST_DATA, "portfolio", `${category.slug}.json`), {
      title: category.title,
      photos,
    });
    index.push({ slug: category.slug, title: category.title, cover: photos[0]?.thumb });
  }
  await writeJson(path.join(DIST_DATA, "portfolio-index.json"), index);
}

async function copyStaticSite() {
  for (const file of ["index.html", "diary.html", "portfolio.html", "about.html"]) {
    await fs.copyFile(path.join(ROOT, file), path.join(DIST, file));
  }
  await copyDir(path.join(ROOT, "css"), path.join(DIST, "css"));
  await copyDir(path.join(ROOT, "js"), path.join(DIST, "js"));
}

async function build() {
  await fs.rm(DIST, { recursive: true, force: true });
  await fs.mkdir(DIST, { recursive: true });

  await copyStaticSite();
  await buildFavorites();
  await buildDiary();
  await buildPortfolio();

  console.log(`Build complete -> ${DIST}`);
}

build().catch((err) => {
  console.error(err);
  process.exit(1);
});
