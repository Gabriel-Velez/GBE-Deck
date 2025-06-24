# 🤝 Contributing to GBE Deck

Thank you for helping make GBE Deck even better!  
This deck is designed to be modular, easy to extend, and community-driven.

---

## 📂 What You Can Contribute

- **New Touch Portal Pages**

  - Each in its own folder under `Pages/YourCategory/YourPage/`
  - Must include:
    - `Pages.tpz2` — your actual page file
    - `Meta.json` — with `name`, `author`, `version`, `description`, `dependencies` (array), `screenshot` (string or array)
    - `Screenshot.png` — clear preview, or multiple for carousel
    - Optional: `Icons/` for custom buttons

- **New Icons**

  - 256x256 PNG, transparent background preferred.

- **Bug Fixes or Layout Improvements**
  - Better navigation, clean positioning, color tweaks — all welcome.

---

## ⚡ Quick Start Template

Copy an existing folder (like `Pages/Templates/Button List 1`) and use it as a starting point for spacing and consistent placement.  
Update the `Meta.json` and replace the page and screenshots with your own.

---

## ✅ Submission Checklist

- ✔️ One .tpz2 file per folder containing 🔒 locked and 🔓 unlcoked pages
- ✔️ Clear `Meta.json` with accurate fields
- ✔️ Screenshots named simply
  - `Screenshot.png`, if single
  - `Screenshot1.png`, `Screenshot2.png` if multiple
- ✔️ Consistent icons if applicable
- ✔️ PR or Issue must describe what your page does!

---

## 🚀 How to Contribute

1. Fork this repo
2. Add your page folder under `Pages/`
3. Run `node generate-pages.js` to verify your folder works in `pages.json`
4. Open a Pull Request — or file an Issue and attach your `.tpz2` and screenshots

---

## 🔑 Review & Merge

- Keep it clean and dark-mode friendly
- We’ll check that `Meta.json` is valid and screenshots load properly.
- We’ll help you tweak layout if needed — all contributions are welcome!

---

Thanks for helping build the ultimate modular macro deck. 💙
