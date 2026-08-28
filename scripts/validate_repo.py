#!/usr/bin/env python3
"""Validate learner-facing documentation and the dependency-free course reader."""

from __future__ import annotations

import argparse
import re
import sys
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
LEARNER_DOCS = [
    ROOT / "README.md",
    *(ROOT / chapter / "README.md" for chapter in (
        "00-introduction",
        "01-assessment",
        "02-planning",
        "03-upgrade-execution",
        "04-cloud",
    )),
    ROOT / "shared-legacy-app" / "README.md",
    ROOT / "shared-legacy-app" / "BEHAVIOR-CONTRACT.md",
    ROOT / "webpage" / "README.md",
]

MARKDOWN_LINK = re.compile(r"!?\[[^\]]*]\(([^)]+)\)")
OBSOLETE_PATTERNS = {
    "NEEDS-BLUR": "redacted screenshot filenames must not carry a work-in-progress suffix",
    "github-copilot-app-modernization": "use the current GitHub Copilot upgrade URLs",
    "/dotnet/core/whats-new/dotnet-10)": "use the current .NET 10 overview URL",
    "/ef/core/what-is-new/ef6-efcore-porting": "use the current EF6-to-EF Core porting URL",
    "/dotnet/core/porting/net-framework-to-core-migration": "use the current ASP.NET Framework migration URL",
}

EXTERNAL_LINKS = [
    "https://learn.microsoft.com/dotnet/core/porting/github-copilot-upgrade/install?pivots=visualstudio",
    "https://learn.microsoft.com/dotnet/core/porting/github-copilot-upgrade/overview",
    "https://learn.microsoft.com/dotnet/core/porting/github-copilot-upgrade/working-with-agent",
    "https://learn.microsoft.com/dotnet/azure/migration/appmod/overview",
    "https://learn.microsoft.com/dotnet/core/releases-and-support",
    "https://learn.microsoft.com/aspnet/core/migration/fx-to-core/start?view=aspnetcore-10.0",
    "https://learn.microsoft.com/ef/efcore-and-ef6/porting/",
    "https://learn.microsoft.com/azure/azure-resource-manager/templates/deploy-what-if",
]


def fail(errors: list[str], message: str) -> None:
    errors.append(message)


def clean_link(raw: str) -> str:
    value = raw.strip().strip("<>")
    if ' "' in value:
        value = value.split(' "', 1)[0]
    return urllib.parse.unquote(value)


def validate_markdown(errors: list[str]) -> None:
    for document in LEARNER_DOCS:
        if not document.is_file():
            fail(errors, f"Missing learner document: {document.relative_to(ROOT)}")
            continue

        text = document.read_text(encoding="utf-8")
        relative_document = document.relative_to(ROOT)

        for pattern, reason in OBSOLETE_PATTERNS.items():
            if pattern in text:
                fail(errors, f"{relative_document}: {reason} ({pattern})")

        for match in MARKDOWN_LINK.finditer(text):
            target = clean_link(match.group(1))
            if not target or target.startswith(("#", "http://", "https://", "mailto:")):
                continue

            path_text = target.split("#", 1)[0]
            resolved = (document.parent / Path(path_text)).resolve()
            try:
                resolved.relative_to(ROOT)
            except ValueError:
                fail(errors, f"{relative_document}: local link leaves the repository: {target}")
                continue

            if not resolved.exists():
                fail(errors, f"{relative_document}: missing local target: {target}")


def validate_reader(errors: list[str]) -> None:
    webpage = ROOT / "webpage"
    index = (webpage / "index.html").read_text(encoding="utf-8")
    ui = (webpage / "scripts" / "ui.js").read_text(encoding="utf-8")
    config = (webpage / "scripts" / "config.js").read_text(encoding="utf-8")

    required_assets = [
        "styles.css",
        "app.js",
        "favicon.svg",
        "scripts/config.js",
        "scripts/dom.js",
        "scripts/reader.js",
        "scripts/state.js",
        "scripts/ui.js",
    ]
    for asset in required_assets:
        if not (webpage / asset).is_file():
            fail(errors, f"webpage: required asset is missing: {asset}")

    for chapter_path in re.findall(r'path:\s*"([^"]+)"', config):
        if not (ROOT / chapter_path).is_file():
            fail(errors, f"webpage navigation points to a missing chapter: {chapter_path}")

    requirements = {
        'class="skip-link"': "skip link",
        'rel="icon"': "favicon link",
        'id="prerequisites-checkpoint"': "prerequisite checkpoint",
        'class="repository-label"': "visible repository label",
    }
    for marker, description in requirements.items():
        if marker not in index:
            fail(errors, f"webpage: missing {description}")

    if "handleDrawerKeydown" not in ui or ".inert = true" not in ui:
        fail(errors, "webpage: mobile drawers must trap focus and make the background inert")
    if "chapter exercises completed" not in ui:
        fail(errors, "webpage: progress must distinguish completed exercises from pages read")


def validate_baseline(errors: list[str]) -> None:
    project = ROOT / "shared-legacy-app" / "src" / "BookCatalog.Web" / "BookCatalog.Web.csproj"
    project_text = project.read_text(encoding="utf-8")
    for stale_transform in ("Web.Debug.config", "Web.Release.config"):
        if stale_transform in project_text:
            fail(errors, f"legacy project references missing transform: {stale_transform}")

    verification_script = ROOT / "shared-legacy-app" / "scripts" / "Test-BookCatalogBehavior.ps1"
    if not verification_script.is_file():
        fail(errors, "BookCatalog behavior verification script is missing")


def validate_deployed_site(errors: list[str], site_root: Path) -> None:
    required_paths = [
        "index.html",
        "favicon.svg",
        "app.js",
        "scripts/config.js",
        "scripts/dom.js",
        "scripts/reader.js",
        "scripts/state.js",
        "scripts/ui.js",
        "content/README.md",
        "content/LICENSE",
        "content/shared-legacy-app/README.md",
        "content/shared-legacy-app/BEHAVIOR-CONTRACT.md",
        "content/shared-legacy-app/scripts/Test-BookCatalogBehavior.ps1",
        *(f"content/{chapter}/README.md" for chapter in (
            "00-introduction",
            "01-assessment",
            "02-planning",
            "03-upgrade-execution",
            "04-cloud",
        )),
    ]
    for relative_path in required_paths:
        if not (site_root / relative_path).is_file():
            fail(errors, f"prepared site is missing: {relative_path}")

    content_root = site_root / "content"
    for document in content_root.rglob("*.md"):
        text = document.read_text(encoding="utf-8")
        relative_document = document.relative_to(site_root)
        for match in MARKDOWN_LINK.finditer(text):
            target = clean_link(match.group(1))
            if not target or target.startswith(("#", "http://", "https://", "mailto:")):
                continue

            target_path = target.split("#", 1)[0]
            resolved = (document.parent / Path(target_path)).resolve()
            try:
                resolved.relative_to(content_root)
            except ValueError:
                fail(errors, f"{relative_document}: deployed link leaves content root: {target}")
                continue

            if not resolved.exists():
                fail(errors, f"{relative_document}: deployed local target is missing: {target}")


def validate_external_links(errors: list[str]) -> None:
    headers = {
        "User-Agent": "dotnet-modernization-course-link-check/1.0",
        "Range": "bytes=0-1024",
    }
    for url in EXTERNAL_LINKS:
        request = urllib.request.Request(url, headers=headers)
        try:
            with urllib.request.urlopen(request, timeout=30) as response:
                if response.status >= 400:
                    fail(errors, f"external link returned HTTP {response.status}: {url}")
        except (urllib.error.URLError, TimeoutError) as error:
            fail(errors, f"external link failed: {url} ({error})")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--check-external",
        action="store_true",
        help="also request selected first-party Microsoft links",
    )
    parser.add_argument(
        "--site-root",
        type=Path,
        help="also validate an assembled static-site directory",
    )
    arguments = parser.parse_args()

    errors: list[str] = []
    validate_markdown(errors)
    validate_reader(errors)
    validate_baseline(errors)
    if arguments.site_root:
        validate_deployed_site(errors, arguments.site_root.resolve())
    if arguments.check_external:
        validate_external_links(errors)

    if errors:
        print("Repository validation failed:", file=sys.stderr)
        for error in errors:
            print(f"- {error}", file=sys.stderr)
        return 1

    print("Repository validation passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
