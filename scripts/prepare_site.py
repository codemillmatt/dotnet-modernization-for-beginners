#!/usr/bin/env python3
"""Assemble the static GitHub Pages artifact."""

from __future__ import annotations

import argparse
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CHAPTERS = (
    "00-introduction",
    "01-assessment",
    "02-planning",
    "03-upgrade-execution",
    "04-cloud",
)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("output", type=Path)
    arguments = parser.parse_args()

    output = arguments.output
    if not output.is_absolute():
        output = ROOT / output
    output = output.resolve()
    expected_output = (ROOT / "_site").resolve()
    if output != expected_output:
        raise ValueError(f"The site output must be {expected_output}.")
    if output.exists():
        shutil.rmtree(output)

    shutil.copytree(ROOT / "webpage", output)
    content = output / "content"
    content.mkdir()
    shutil.copy2(ROOT / "README.md", content / "README.md")
    shutil.copy2(ROOT / "LICENSE", content / "LICENSE")

    for chapter in CHAPTERS:
        shutil.copytree(ROOT / chapter, content / chapter)

    baseline = content / "shared-legacy-app"
    baseline.mkdir()
    shutil.copy2(ROOT / "shared-legacy-app" / "README.md", baseline / "README.md")
    shutil.copy2(
        ROOT / "shared-legacy-app" / "BEHAVIOR-CONTRACT.md",
        baseline / "BEHAVIOR-CONTRACT.md",
    )
    shutil.copytree(
        ROOT / "shared-legacy-app" / "scripts",
        baseline / "scripts",
    )

    print(f"Prepared static site at {output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
