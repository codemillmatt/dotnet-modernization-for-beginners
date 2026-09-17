import { contentUrl, siteUrl } from "./config.js";
import { normalizePath, parseRoute, routeForPath } from "./routes.js";
import { article, chapterPager, outlineNav } from "./dom.js";
import { buildOutline, closeDrawers, escapeHtml, renderPager, renderProgress } from "./ui.js";

let request;
let current = parseRoute("#/overview").chapter;
export const getCurrentChapter = () => current;

function rewriteLinks(chapter) {
  const folder = chapter.path.includes("/") ? chapter.path.slice(0, chapter.path.lastIndexOf("/") + 1) : "";
  for (const image of article.querySelectorAll("img[src]")) {
    const src = image.getAttribute("src");
    if (/^https?:/i.test(src)) {
      image.replaceWith(document.createTextNode(image.alt || "External image"));
      continue;
    }
    image.src = contentUrl(normalizePath(folder + src));
    image.loading = "lazy";
    image.addEventListener("error", () => {
      const notice = document.createElement("p");
      notice.className = "notice";
      notice.textContent = `The image could not load. ${image.alt}`;
      image.replaceWith(notice);
    }, { once: true });
  }
  for (const link of article.querySelectorAll("a[href]")) {
    const href = link.getAttribute("href");
    if (/^(https?:|mailto:)/i.test(href)) {
      link.rel = "noreferrer";
      continue;
    }
    const [path, section = ""] = href.split("#");
    const target = path ? normalizePath(folder + path) : chapter.path;
    link.href = routeForPath(target, section) || `${contentUrl(target)}${section ? `#${section}` : ""}`;
  }
}

function addCodeCopy() {
  for (const pre of article.querySelectorAll("pre")) {
    const code = pre.querySelector("code");
    if (!code || code.classList.contains("language-mermaid")) continue;
    const toolbar = document.createElement("div");
    toolbar.className = "code-toolbar";
    const language = [...code.classList].find(value => value.startsWith("language-"))?.slice(9) || "text";
    toolbar.innerHTML = `<span>${escapeHtml(language)}</span><button type="button">Copy code</button>`;
    const button = toolbar.querySelector("button");
    button.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(code.textContent);
        button.textContent = "Copied";
        document.querySelector("#copy-notice").textContent = "The code is copied.";
      } catch {
        button.textContent = "Copy failed";
        document.querySelector("#copy-notice").textContent = "Copy failed. Select the code and copy it manually.";
      }
    });
    pre.before(toolbar);
    pre.classList.add("with-toolbar");
    pre.tabIndex = 0;
    pre.setAttribute("aria-label", `${language} code`);
  }
}

function addHero() {
  const hero = document.createElement("div");
  hero.className = "workshop-hero";
  const copy = document.createElement("div");
  copy.className = "hero-copy";
  for (const node of [...article.childNodes]) {
    if (node.nodeType === Node.ELEMENT_NODE && node.tagName === "H2") break;
    copy.append(node);
  }
  const art = document.createElement("img");
  art.src = siteUrl("assets/retro-workshop.svg");
  art.alt = "";
  art.className = "hero-art";
  art.setAttribute("aria-hidden", "true");
  hero.append(copy, art);
  article.prepend(hero);
  const actions = copy.querySelector("p:has(> strong > a)");
  if (actions) {
    const links = [...actions.querySelectorAll("a")];
    actions.className = "hero-actions";
    const primary = document.createElement("strong");
    primary.append(links[0]);
    const secondary = document.createElement("span");
    secondary.className = "hero-secondary";
    secondary.append(...links.slice(1));
    actions.replaceChildren(primary, secondary);
  }
}

async function renderDiagrams(chapter, signal) {
  const blocks = [...article.querySelectorAll("code.language-mermaid")];
  if (!blocks.length) return;
  const response = await fetch(siteUrl("diagrams/manifest.json"), { signal });
  if (!response.ok) throw new Error("The diagram manifest could not load.");
  const manifest = await response.json();
  const assets = manifest.documents[chapter.path];
  if (assets?.length !== blocks.length) throw new Error("The diagrams do not match the lesson. Rebuild the website.");
  if (signal.aborted) return;
  blocks.forEach((block, index) => {
    const figure = document.createElement("figure");
    figure.className = "diagram-asset";
    for (const theme of ["light", "dark"]) {
      const link = document.createElement("a");
      link.className = `diagram-${theme}`;
      link.href = siteUrl(assets[index][theme]);
      link.target = "_blank";
      link.rel = "noreferrer";
      link.setAttribute("aria-label", `Open a larger ${assets[index].alt}`);
      const img = document.createElement("img");
      img.src = link.href;
      img.alt = assets[index].alt;
      link.append(img);
      figure.append(link);
    }
    block.parentElement.replaceWith(figure);
  });
}

export async function renderRoute(store) {
  request?.abort();
  request = new AbortController();
  const { signal } = request;
  closeDrawers();
  article.setAttribute("aria-busy", "true");
  article.innerHTML = '<p role="status">The lesson is loading.</p>';
  chapterPager.innerHTML = "";
  outlineNav.innerHTML = "";
  try {
    const { chapter, section } = parseRoute(location.hash);
    const response = await fetch(contentUrl(chapter.path), { signal });
    if (!response.ok) throw new Error(`The lesson could not load (HTTP ${response.status}).`);
    const markdown = await response.text();
    if (signal.aborted) return;
    current = chapter;
    article.innerHTML = DOMPurify.sanitize(marked.parse(markdown, { gfm: true }), { USE_PROFILES: { html: true } });
    rewriteLinks(chapter);
    if (chapter.slug === "overview") addHero();
    buildOutline(chapter);
    addCodeCopy();
    await renderDiagrams(chapter, signal);
    if (signal.aborted) return;
    document.body.classList.toggle("is-overview", chapter.slug === "overview");
    document.querySelector("#chapter-label").textContent = chapter.slug === "overview"
      ? "A .NET workshop with GitHub Copilot" : chapter.slug === "reference"
      ? "Your workshop reference" : `${chapter.number} / ${chapter.core ? "Core workshop" : "Optional Azure extension"}`;
    store.visit(chapter.slug);
    renderProgress(store, chapter);
    renderPager(chapter, store);
    document.title = `${chapter.title} | .NET Modernization`;
    article.removeAttribute("aria-busy");
    const main = document.querySelector("#main-content");
    main.focus({ preventScroll: true });
    const target = section ? document.getElementById(section) : null;
    if (section && !target) {
      const notice = document.createElement("p");
      notice.className = "notice";
      notice.textContent = "This section moved. Use the page outline to find it.";
      article.prepend(notice);
    }
    if (target) target.scrollIntoView({ behavior: "instant", block: "start" });
    else window.scrollTo({ top: 0, behavior: "instant" });
  } catch (error) {
    if (signal.aborted) return;
    article.removeAttribute("aria-busy");
    article.innerHTML = `<div class="notice" role="alert"><h1>The lesson could not load</h1>
      <p>${escapeHtml(error.message)}</p><button id="retry-lesson" type="button">Try again</button>
      <a href="#/overview">Return to the overview</a></div>`;
    document.querySelector("#retry-lesson").addEventListener("click", () => renderRoute(store));
    console.error(error);
  }
}
