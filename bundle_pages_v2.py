import json
import zipfile
import tempfile
import shutil
from pathlib import Path

# Paths
pages_root = Path("Pages")
output_file = Path("GBE-Custom-Bundle.tpz2")
selection_file = Path("bundle-trigger/selected-pages.json")

# Load selected page names
with open(selection_file, "r") as f:
    selected = json.load(f).get("pages", [])

# Merged data holders
merged_buttons = []
merged_pages = []
merged_images = []
uuid_set = set()

# Start temp workspace
with tempfile.TemporaryDirectory() as tmpdir:
    tmpdir_path = Path(tmpdir)
    final_img_dir = tmpdir_path / "img"
    final_img_dir.mkdir()

    for name in selected:
        print(f"🔍 Looking for: Pages/**/{name}/{name}.tpz2")
        tpz_path = None

        for path in pages_root.rglob(f"{name}/{name}.tpz2"):
            tpz_path = path
            break

        if tpz_path and tpz_path.exists():
            print(f"✅ Found: {tpz_path}")
        else:
            print(f"❌ Not found: {name} — skipping")
            continue

        extract_dir = tmpdir_path / name
        with zipfile.ZipFile(tpz_path, 'r') as zip_ref:
            zip_ref.extractall(extract_dir)

        data_path = extract_dir / "data.json"
        img_path = extract_dir / "img"

        # Merge data.json
        if data_path.exists():
            with open(data_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                merged_buttons.extend(data.get("buttons", []))
                merged_pages.extend(data.get("pages", []))
                for img in data.get("images", []):
                    if img["uuid"] not in uuid_set:
                        merged_images.append(img)
                        uuid_set.add(img["uuid"])

        # Merge img files
        if img_path.exists():
            print(f"📂 Found image folder: {img_path}")
            img_files = list(img_path.iterdir())
            if not img_files:
                print("⚠️ Image folder is empty.")
            for file in img_files:
                print(f"🖼️ Found icon: {file.name}")
                target = final_img_dir / file.name
                if not target.exists():
                    shutil.copy(file, target)
                    print(f"✅ Copied to: {target}")
                else:
                    print(f"⏩ Skipped (already exists): {target}")
        else:
            print(f"🚫 No img folder found in: {extract_dir}")

    # Optional: dummy image to test zip (remove later)
    dummy_path = final_img_dir / "debug.txt"
    dummy_path.write_text("image merge test")

    # Use version from last page (or fallback)
    version_data = {"version": "3.1.6"}
    if (extract_dir / "version.json").exists():
        with open(extract_dir / "version.json", "r", encoding="utf-8") as f:
            version_data = json.load(f)

    # Build new data.json
    merged_data = {
        "buttons": merged_buttons,
        "pages": merged_pages,
        "images": merged_images,
        "version": version_data.get("version", "3.1.6")
    }

    with open(tmpdir_path / "data.json", "w", encoding="utf-8") as f:
        json.dump(merged_data, f, indent=2)

    with open(tmpdir_path / "version.json", "w", encoding="utf-8") as f:
        json.dump(version_data, f, indent=2)

    # DEBUG: what's in img/
    print(f"\n📁 Final img/ contents:")
    for p in final_img_dir.rglob("*"):
        print(f"   → {p.relative_to(tmpdir_path)}")

    # ✅ Final zip: only top-level + unified img/
    with zipfile.ZipFile(output_file, 'w') as bundle:
        for file in tmpdir_path.glob("*.*"):
            archive_path = file.name
            print(f"📦 Adding top-level file: {archive_path}")
            bundle.write(file, arcname=archive_path)

        for img_file in final_img_dir.rglob("*"):
            if img_file.is_file():
                archive_path = img_file.relative_to(tmpdir_path)
                print(f"🧷 Adding image file: {archive_path}")
                bundle.write(img_file, arcname=str(archive_path))

print(f"\n✅ [DONE] Created bundle: {output_file.resolve()}")
