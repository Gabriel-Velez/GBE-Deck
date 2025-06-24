import fs from "fs";
import path from "path";

const PAGES_DIR = "./Pages";
const OUTPUT = "./src/data/pages.json";

// 1️⃣ Read top-level folders
const allCategories = fs
  .readdirSync(PAGES_DIR)
  .filter((folder) => fs.statSync(path.join(PAGES_DIR, folder)).isDirectory());

// 2️⃣ Custom order: General first, Templates next, then alphabetical
const priority = ["General", "Templates", "Web Browser", "Music"];
const sortedCategories = [
  ...priority,
  ...allCategories.filter((c) => !priority.includes(c)).sort((a, b) => a.localeCompare(b)),
];

const output = {};

// 3️⃣ Walk each category & page
sortedCategories.forEach((category) => {
  const categoryPath = path.join(PAGES_DIR, category);
  const pages = fs
    .readdirSync(categoryPath)
    .filter((folder) => fs.statSync(path.join(categoryPath, folder)).isDirectory());

  output[category] = pages.map((page) => {
    const pagePath = path.join(categoryPath, page);

    // Read Meta.json
    const meta = JSON.parse(fs.readFileSync(path.join(pagePath, "Meta.json"), "utf-8"));

    // Attach the relative Pages.tpz2 path
    const file = `${category}/${page}/Pages.tpz2`;

    // Ensure screenshots have relative paths
    const screenshot = Array.isArray(meta.screenshot)
      ? meta.screenshot.map((s) => `${category}/${page}/${s}`)
      : `${category}/${page}/${meta.screenshot}`;

    // Also auto-fix dependencies if needed (optional)
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

// 4️⃣ Write output
fs.writeFileSync(OUTPUT, JSON.stringify(output, null, 2));
console.log(`✅ pages.json generated at ${OUTPUT}`);
