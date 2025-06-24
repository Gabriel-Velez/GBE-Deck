import fs from "fs";
import path from "path";

const PAGES_DIR = "./Pages";
const OUTPUT = "./src/data/pages.json";

// 1️⃣ Read all top-level category folders
const allCategories = fs
  .readdirSync(PAGES_DIR)
  .filter((folder) => fs.statSync(path.join(PAGES_DIR, folder)).isDirectory());

// 2️⃣ Custom priority order
const priority = ["General", "Templates", "Web Browser", "Music"];
const sortedCategories = [
  ...priority,
  ...allCategories.filter((c) => !priority.includes(c)).sort((a, b) => a.localeCompare(b)),
];

const output = {};

// 3️⃣ Build each category’s pages
sortedCategories.forEach((category) => {
  const categoryPath = path.join(PAGES_DIR, category);
  const pages = fs
    .readdirSync(categoryPath)
    .filter((folder) => fs.statSync(path.join(categoryPath, folder)).isDirectory());

  output[category] = pages.map((page) => {
    const pagePath = path.join(categoryPath, page);
    const meta = JSON.parse(fs.readFileSync(path.join(pagePath, "Meta.json"), "utf-8"));

    // Build relative file path
    const file = `${category}/${page}/Pages.tpz2`;

    // ✅ Encode the full raw GitHub URL with `refs/heads/main` and encoded paths
    const GITHUB_RAW_BASE =
      "https://raw.githubusercontent.com/Gabriel-Velez/GBE-Deck/refs/heads/main/Pages/";
    const encode = (str) => encodeURIComponent(str).replace(/%2F/g, "/");

    const screenshot = Array.isArray(meta.screenshot)
      ? meta.screenshot.map(
          (s) => `${GITHUB_RAW_BASE}${encode(category)}/${encode(page)}/${encode(s)}`
        )
      : `${GITHUB_RAW_BASE}${encode(category)}/${encode(page)}/${encode(meta.screenshot)}`;

    const dependencies = meta.dependencies || [];

    return {
      file,
      meta: {
        ...meta,
        screenshot,
        dependencies,
      },
    };
  });
});

// 4️⃣ Write pages.json
fs.writeFileSync(OUTPUT, JSON.stringify(output, null, 2));
console.log(`✅ pages.json generated at ${OUTPUT}`);
