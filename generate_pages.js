import fs from "fs";
import path from "path";

const PAGES_DIR = "./Pages";
const OUTPUT = "./src/data/pages.json";

// 1️⃣ Read all top-level category folders
const allCategories = fs
  .readdirSync(PAGES_DIR)
  .filter((folder) => fs.statSync(path.join(PAGES_DIR, folder)).isDirectory());

// 2️⃣ Custom priority: General first, Templates second, then specific, then alphabetical
const priority = ["General", "Templates", "Web Browser", "Music"];
const sortedCategories = [
  ...priority,
  ...allCategories.filter((c) => !priority.includes(c)).sort((a, b) => a.localeCompare(b)),
];

const output = {};

// 3️⃣ For each category, build its pages list
sortedCategories.forEach((category) => {
  const categoryPath = path.join(PAGES_DIR, category);
  const pages = fs
    .readdirSync(categoryPath)
    .filter((folder) => fs.statSync(path.join(categoryPath, folder)).isDirectory());

  output[category] = pages.map((page) => {
    const pagePath = path.join(categoryPath, page);

    // Read Meta.json for page metadata
    const meta = JSON.parse(fs.readFileSync(path.join(pagePath, "Meta.json"), "utf-8"));

    // Build the file path for .tpz2 file
    const file = `${category}/${page}/Pages.tpz2`;

    // ✅ Build full GitHub Raw URL(s) for screenshots
    const GITHUB_RAW_BASE = "https://raw.githubusercontent.com/Gabriel-Velez/GBE-Deck/main/Pages/";
    const screenshot = Array.isArray(meta.screenshot)
      ? meta.screenshot.map((s) => `${GITHUB_RAW_BASE}${category}/${page}/${s}`)
      : `${GITHUB_RAW_BASE}${category}/${page}/${meta.screenshot}`;

    // Pass through any dependencies or default to empty array
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

// 4️⃣ Write out pages.json nicely formatted
fs.writeFileSync(OUTPUT, JSON.stringify(output, null, 2));
console.log(`✅ pages.json generated at ${OUTPUT}`);
