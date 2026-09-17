import { createHash } from "node:crypto";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { chapters } from "../scripts/chapters.js";
import { fileURLToPath } from "node:url";

const documents = chapters.map(chapter => chapter.path);

const themes = {
  light: {
    theme: "base",
    themeVariables: {
      background: "#fffbf2",
      primaryColor: "#fff2d5",
      primaryTextColor: "#102e2a",
      primaryBorderColor: "#14675f",
      lineColor: "#14675f",
      secondaryColor: "#f0c24d",
      tertiaryColor: "#fffbf2"
    }
  },
  dark: {
    theme: "base",
    themeVariables: {
      background: "#153331",
      primaryColor: "#103d3d",
      primaryTextColor: "#fff2d5",
      primaryBorderColor: "#86e1cd",
      lineColor: "#86e1cd",
      secondaryColor: "#204642",
      tertiaryColor: "#153331"
    }
  }
};
const rendererFingerprint = JSON.stringify({ version: 2, themes });

const [contentArgument, outputArgument] = process.argv.slice(2);
if (!contentArgument || !outputArgument) {
  throw new Error("Usage: node render-mermaid.mjs <content-directory> <output-directory>");
}

const contentDirectory = resolve(contentArgument);
const outputDirectory = resolve(outputArgument);
const temporaryDirectory = await mkdtemp(join(tmpdir(), "dotnet-modernization-mermaid-"));
const manifest = { version: 1, documents: {} };
const rendered = new Set();

function diagramTitle(markdown, diagramIndex) {
  const prefix = markdown.slice(0, diagramIndex);
  const headings = [...prefix.matchAll(/^#{1,6}\s+(.+)$/gm)];
  const heading = headings.at(-1)?.[1].replace(/[*_`]/g, "").trim();
  return heading ? `${heading} diagram` : "Course diagram";
}

function sourceForTheme(source, textColor) {
  return source.replace(
    /(\bclassDef\b[^\r\n]*\bcolor:)#[0-9a-fA-F]{3,8}/g,
    `$1${textColor}`
  );
}

function renderDiagram(sourceFile, outputFile, configFile, backgroundColor, puppeteerConfigFile) {
  const executable = process.execPath;
  const argumentsList = [
    fileURLToPath(new URL("../../node_modules/@mermaid-js/mermaid-cli/src/cli.js", import.meta.url)),
    "--input", sourceFile,
    "--output", outputFile,
    "--configFile", configFile,
    "--backgroundColor", backgroundColor,
    "--quiet"
  ];

  if (puppeteerConfigFile) {
    argumentsList.push("--puppeteerConfigFile", puppeteerConfigFile);
  }

  const result = spawnSync(executable, argumentsList, {
    encoding: "utf8",
    shell: false
  });

  if (result.status !== 0) {
    throw new Error(result.error?.message || result.stderr || result.stdout || `Mermaid CLI exited with status ${result.status}`);
  }
}

try {
  await mkdir(outputDirectory, { recursive: true });
  const configFiles = {};

  for (const [theme, config] of Object.entries(themes)) {
    const configFile = join(temporaryDirectory, `${theme}.json`);
    await writeFile(configFile, JSON.stringify(config));
    configFiles[theme] = configFile;
  }

  let puppeteerConfigFile;
  if (process.env.CI === "true") {
    puppeteerConfigFile = join(temporaryDirectory, "puppeteer.json");
    await writeFile(puppeteerConfigFile, JSON.stringify({
      args: ["--no-sandbox", "--disable-setuid-sandbox"]
    }));
  }

  for (const documentPath of documents) {
    const markdown = await readFile(join(contentDirectory, documentPath), "utf8");
    const diagrams = [...markdown.matchAll(/```mermaid[^\r\n]*\r?\n([\s\S]*?)```/g)];
    manifest.documents[documentPath] = [];

    for (const [index, match] of diagrams.entries()) {
      const source = match[1].trim();
      const hash = createHash("sha256")
        .update(rendererFingerprint)
        .update("\0")
        .update(source)
        .digest("hex")
        .slice(0, 16);

      if (!rendered.has(hash)) {
        for (const [theme, config] of Object.entries(themes)) {
          const sourceFile = join(temporaryDirectory, `${hash}-${theme}.mmd`);
          await writeFile(sourceFile, sourceForTheme(source, config.themeVariables.primaryTextColor));
          renderDiagram(
            sourceFile,
            join(outputDirectory, `${hash}-${theme}.svg`),
            configFiles[theme],
            config.themeVariables.background,
            puppeteerConfigFile
          );
        }

        rendered.add(hash);
      }

      manifest.documents[documentPath].push({
        light: `diagrams/${hash}-light.svg`,
        dark: `diagrams/${hash}-dark.svg`,
        alt: diagramTitle(markdown, match.index),
        index
      });
    }
  }

  await writeFile(join(outputDirectory, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`Rendered ${rendered.size} unique Mermaid diagrams in light and dark themes.`);
} finally {
  await rm(temporaryDirectory, { recursive: true, force: true });
}