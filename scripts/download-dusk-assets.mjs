import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const sourcePath = path.join(root, "project-old/projetos-base-inicial/dusk-system/data/dusk-index.json");
const catalogPath = path.join(root, "src/lib/data/dusk-drops.json");
const publicRoot = path.join(root, "public/assets/dusk-drops");

const source = JSON.parse(await readFile(sourcePath, "utf8"));

function extensionFromUrl(url) {
  const pathname = new URL(url).pathname.toLowerCase();
  const ext = path.extname(pathname);
  return ext && ext.length <= 6 ? ext : ".jpg";
}

async function exists(filePath) {
  try {
    await stat(filePath);
    return true;
  } catch {
    return false;
  }
}

async function download(url, targetPath) {
  if (!url || (await exists(targetPath))) {
    return false;
  }

  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; ValePrimordialAssetBot/1.0)",
    },
    redirect: "follow",
  });

  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`);
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.startsWith("image/")) {
    throw new Error(`unexpected content-type ${contentType || "unknown"}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  await writeFile(targetPath, buffer);
  return true;
}

function normalizeHtml(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&[^;\s]+;/g, " ")
    .toLowerCase();
}

function absolutizeImageUrl(src, base) {
  if (!src || src.startsWith("data:")) {
    return "";
  }

  try {
    return new URL(src, base).toString();
  } catch {
    return "";
  }
}

async function discoverBossImages() {
  const bossImageUrls = new Map();

  if (!source.meta?.source) {
    return bossImageUrls;
  }

  try {
    const response = await fetch(source.meta.source, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; ValePrimordialAssetBot/1.0)",
      },
    });

    if (!response.ok) {
      return bossImageUrls;
    }

    const html = await response.text();
    const rows = html.match(/<tr[\s\S]*?<\/tr>/gi) ?? [];

    for (const boss of source.bosses) {
      const bossNeedle = normalizeHtml(boss.name);
      const aliasNeedles = (boss.aliases ?? []).map(normalizeHtml);
      const row = rows.find((candidate) => {
        const normalized = normalizeHtml(candidate);
        return normalized.includes(bossNeedle) || aliasNeedles.some((alias) => normalized.includes(alias));
      });

      const imageSrc = row?.match(/<img[^>]+src=["']([^"']+)["']/i)?.[1];
      const url = absolutizeImageUrl(imageSrc, source.meta.source);

      if (url) {
        bossImageUrls.set(boss.id, url);
      }
    }
  } catch {
    return bossImageUrls;
  }

  return bossImageUrls;
}

await mkdir(path.join(publicRoot, "items"), { recursive: true });
await mkdir(path.join(publicRoot, "bosses"), { recursive: true });

const bossImageUrls = await discoverBossImages();
const failures = [];
let downloaded = 0;

const items = await Promise.all(
  source.items.map(async (item) => {
    const ext = item.imageUrl ? extensionFromUrl(item.imageUrl) : ".jpg";
    const fileName = `${item.id}${ext}`;
    const targetPath = path.join(publicRoot, "items", fileName);

    if (item.imageUrl) {
      try {
        downloaded += (await download(item.imageUrl, targetPath)) ? 1 : 0;
      } catch (error) {
        failures.push({ kind: "item", id: item.id, url: item.imageUrl, error: error.message });
      }
    }

    return {
      ...item,
      image: `/assets/dusk-drops/items/${fileName}`,
    };
  }),
);

const bosses = await Promise.all(
  source.bosses.map(async (boss) => {
    const imageUrl = bossImageUrls.get(boss.id) ?? "";
    const ext = imageUrl ? extensionFromUrl(imageUrl) : ".jpg";
    const fileName = `${boss.id}${ext}`;
    const targetPath = path.join(publicRoot, "bosses", fileName);

    if (imageUrl) {
      try {
        downloaded += (await download(imageUrl, targetPath)) ? 1 : 0;
      } catch (error) {
        failures.push({ kind: "boss", id: boss.id, url: imageUrl, error: error.message });
      }
    }

    return {
      ...boss,
      image: imageUrl ? `/assets/dusk-drops/bosses/${fileName}` : "",
      imageUrl,
    };
  }),
);

const itemById = Object.fromEntries(items.map((item) => [item.id, item]));
const bossById = Object.fromEntries(bosses.map((boss) => [boss.id, boss]));
const duskById = Object.fromEntries(source.dusks.map((dusk) => [dusk.id, dusk]));

const catalog = {
  ...source,
  bosses,
  items,
  indexes: {
    itemById,
    bossById,
    duskById,
  },
};

await writeFile(catalogPath, `${JSON.stringify(catalog, null, 2)}\n`, "utf8");

console.log(
  JSON.stringify(
    {
      catalog: path.relative(root, catalogPath),
      items: items.length,
      bosses: bosses.length,
      downloaded,
      bossImagesDiscovered: bossImageUrls.size,
      failures,
    },
    null,
    2,
  ),
);
