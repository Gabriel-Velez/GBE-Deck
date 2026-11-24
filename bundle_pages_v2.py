import json
import os
import re
import zipfile
import tempfile
import shutil
from pathlib import Path

# Paths
pages_root = Path("Pages")
selection_file = Path("bundle-trigger/selected-pages.json")

selection_json = os.environ.get("SELECTED_PAGES_JSON")
if selection_json:
    selected = json.loads(selection_json)
    bundle_id = os.environ.get("BUNDLE_ID", "fallback")
else:
    with open(selection_file, "r", encoding="utf-8") as f:
        selection_data = json.load(f)
    selected = selection_data.get("pages", [])
    bundle_id = selection_data.get("bundleId", "fallback")

if (
    not isinstance(selected, list)
    or not selected
    or not all(
        isinstance(name, str)
        and name.strip()
        and name not in {".", ".."}
        and "/" not in name
        and "\\" not in name
        for name in selected
    )
):
    raise ValueError("Selection must contain a non-empty list of page names")
if not isinstance(bundle_id, str) or not re.fullmatch(r"[A-Za-z0-9-]{1,64}", bundle_id):
    raise ValueError("Bundle ID may contain only letters, numbers, and hyphens")

output_file = Path("GBE-Custom-Bundle.tpz2")

# Merged data holders
merged_buttons = []
merged_pages = []
merged_images = []
uuid_set = set()

def find_tpz2_path(target_name):
    """Search recursively under Pages/ for a folder named `target_name` that contains Pages.tpz2."""
    for folder in pages_root.rglob("*"):
        if folder.is_dir() and folder.name == target_name:
            tpz = folder / "Pages.tpz2"
            if tpz.exists():
                return tpz
    return None

# Start temp workspace
with tempfile.TemporaryDirectory() as tmpdir:
    tmpdir_path = Path(tmpdir)
    final_img_dir = tmpdir_path / "img"
    final_img_dir.mkdir()

    for name in selected:
        print(f"🔍 Searching for: {name}/Pages.tpz2")

        tpz_path = find_tpz2_path(name)
        if not tpz_path:
            raise FileNotFoundError(f"Selected page was not found: {name}")

        print(f"✅ Found: {tpz_path}")
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
            target = final_img_dir / file.name
            if not target.exists():
                shutil.copy(file, target)
                print(f"✅ Copied root image: {file.name}")
            else:
                print(f"⏩ Skipped duplicate root: {file.name}")

        img_subfolder = extract_dir / "img"
        if img_subfolder.exists():
            for file in img_subfolder.glob("*.png"):
                target = final_img_dir / file.name
                if not target.exists():
                    shutil.copy(file, target)
                    print(f"✅ Copied nested image: {file.name}")
                else:
                    print(f"⏩ Skipped duplicate nested: {file.name}")

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

    else:
        raise ValueError("Selected pages did not contain any Touch Portal pages")

    print(f"\n📦 Creating bundle: {output_file}")
    with zipfile.ZipFile(output_file, "w") as bundle:
        for file in tmpdir_path.glob("*.*"):
            bundle.write(file, arcname=file.name)
            print(f"📦 Added file: {file.name}")

        for img_file in final_img_dir.glob("*"):
            bundle.write(img_file, arcname=img_file.name)
            print(f"🧷 Added image: {img_file.name}")

print(f"\n✅ [DONE] Created bundle: {output_file.resolve()}")
