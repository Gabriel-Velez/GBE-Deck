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
        print(f"🔍 Looking for: Pages/{name}/Pages.tpz2")

        tpz_path = pages_root / name / "Pages.tpz2"

        if tpz_path.exists():
            print(f"✅ Found: {tpz_path}")
        else:
            print(f"❌ Not found: {tpz_path} — skipping")
            continue

        extract_dir = tmpdir_path / name
        with zipfile.ZipFile(tpz_path, 'r') as zip_ref:
            zip_ref.extractall(extract_dir)

        print(f"📂 Contents of {extract_dir}:")
        for item in extract_dir.iterdir():
            print(f"   → {item.name}")

        data_path = extract_dir / "data.json"
        if data_path.exists():
            with open(data_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                merged_buttons.extend(data.get("buttons", []))
                merged_pages.extend(data.get("pages", []))
                for img in data.get("images", []):
                    if img["uuid"] not in uuid_set:
                        merged_images.append(img)
                        uuid_set.add(img["uuid"])

        for file in extract_dir.glob("*.png"):
            if file.is_file():
                print(f"🖼️ Copy root: {file.name}")
                target = final_img_dir / file.name
                if not target.exists():
                    shutil.copy(file, target)
                    print(f"✅ Copied to: {target}")
                else:
                    print(f"⏩ Skipped (already exists): {target}")

        img_subfolder = extract_dir / "img"
        if img_subfolder.exists():
            for file in img_subfolder.glob("*.png"):
                if file.is_file():
                    print(f"🖼️ Copy subfolder: {file.name}")
                    target = final_img_dir / file.name
                    if not target.exists():
                        shutil.copy(file, target)
                        print(f"✅ Copied to: {target}")
                    else:
                        print(f"⏩ Skipped (already exists): {target}")

    version_data = {"version": "3.1.6"}
    if merged_pages:
        last_page_name = selected[-1]
        last_extract_dir = tmpdir_path / last_page_name
        version_path = last_extract_dir / "version.json"
        if version_path.exists():
            with open(version_path, "r", encoding="utf-8") as f:
                version_data = json.load(f)

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

        print(f"\n📦 Creating bundle...")
        with zipfile.ZipFile(output_file, 'w') as bundle:
            for file in tmpdir_path.glob("*.*"):
                archive_path = file.name
                print(f"📦 Adding: {archive_path}")
                bundle.write(file, arcname=archive_path)

            for img_file in final_img_dir.glob("*"):
                if img_file.is_file():
                    archive_path = img_file.name
                    print(f"🧷 Adding image: {archive_path}")
                    bundle.write(img_file, arcname=str(archive_path))

print(f"\n✅ [DONE] Created bundle: {output_file.resolve()}")
