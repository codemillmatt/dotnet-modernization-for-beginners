"""Package only the staged samples, behavior checks, and license."""
from pathlib import Path
import sys
from zipfile import ZipFile, ZIP_DEFLATED
import re

root = Path(sys.argv[1]).resolve()
destination = Path(sys.argv[2])
with ZipFile(destination, "w", ZIP_DEFLATED) as archive:
    for relative in ["shared-legacy-app", "examples", "tests/BookCatalog.Tests", ".config",
                     "scripts", "docs", "webpage/README.md", "package.json", "package-lock.json",
                     "README.md", "LICENSE"]:
        target = root / relative
        paths = sorted(target.rglob("*")) if target.is_dir() else [target]
        for path in paths:
            if path.is_file():
                if path.suffix == ".md":
                    # Keep source references useful outside the full repository.
                    def rewrite(match):
                        label, target = match.groups()
                        if target.startswith(("#", "http:", "https:", "mailto:")):
                            return match.group(0)
                        relative_target, _, anchor = target.partition("#")
                        resolved = (path.parent / relative_target).resolve()
                        if not resolved.is_relative_to(root):
                            return match.group(0)
                        if resolved.parts[len(root.parts):][0] in (
                                "00-introduction", "01-assessment", "02-planning",
                                "03-upgrade-execution", "04-cloud"):
                            target = ("https://github.com/codemillmatt/dotnet-modernization-for-beginners/blob/main/"
                                      + resolved.relative_to(root).as_posix()
                                      + (("#" + anchor) if anchor else ""))
                        return f"{label}({target})"
                    text = re.sub(r"(!?\[[^\]]*\])\(([^)]+)\)", rewrite, path.read_text())
                    archive.writestr(path.relative_to(root).as_posix(), text)
                else:
                    archive.write(path, path.relative_to(root))
    archive.writestr("DOWNLOAD-README.txt",
                     "These files contain the workshop samples and their portable application tests.\n"
                     "Run the sample through examples/modernized/README.md or shared-legacy-app/README.md.\n"
                     "For website tooling and the full lessons, use the repository clone.\n")
