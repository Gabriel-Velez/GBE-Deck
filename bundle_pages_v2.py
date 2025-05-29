import json
import zipfile
import tempfile
from pathlib import Path

# Paths
pages_dir = Path("Pages")
output_file = Path("GBE-Custom-Bundle.tpz2")
selection_file = Path("bundle-trigger/selected-pages.json")

# Load selected page names
with open(selection_file, "r") as f:
    selected = json.load(f).get("pages", [])

# Temp folder for gathering .tpi files
with tempfile.TemporaryDirectory() as tmpdir:
    tmpdir_path = Path(tmpdir)

    for name in selected:
        # Convert to kebab-case filename (e.g. "PhotoShop Tools" -> "PhotoShop-Tools")
        folder_name = name.replace(" ", "-")
        tpz_path = pages_dir / folder_name / f"{folder_name}.tpz2"

        if not tpz_path.exists():
            print(f"[WARN] Missing: {tpz_path}")
            continue

        with zipfile.ZipFile(tpz_path, 'r') as zip_ref:
            for file in zip_ref.namelist():
                if file.endswith(".tpi"):
                    zip_ref.extract(file, tmpdir_path)

    # Bundle all extracted .tpi into one .tpz2 file
    with zipfile.ZipFile(output_file, 'w') as bundle:
        for tpi_file in tmpdir_path.rglob("*.tpi"):
            bundle.write(tpi_file, arcname=tpi_file.name)

print(f"[DONE] Created bundle: {output_file.resolve()}")