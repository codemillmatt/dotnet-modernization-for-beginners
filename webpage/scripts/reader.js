import { contentUrl, siteUrl } from "./config.js";
import { normalizePath, parseRoute, routeForPath } from "./routes.js";
import { article, chapterPager, outlineNav } from "./dom.js";
import { buildOutline, closeDrawers, escapeHtml, renderPager, renderProgress } from "./ui.js";
import { applyEra, getEra, referenceEra } from "./eras.js";
import { illustrations, illustrationPath } from "./illustrations.js";

let request;
let current = parseRoute("#/overview").chapter;
export const getCurrentChapter = () => current;

function reportImageFailure(image) {
  image.addEventListener("error", () => {
    const notice = document.createElement("p");
    notice.className = "notice";
    notice.setAttribute("role", "status");
    notice.textContent = `The image could not load. ${image.alt}`;
    image.replaceWith(notice);
  }, { once: true });
}

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
    reportImageFailure(image);
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
    if (!code) continue;
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

function addChapterHeader(chapter) {
  const heading = article.querySelector("h1");
  if (!heading) throw new Error("The chapter has no title. Check its source.");
  const panel = document.createElement("div");
  panel.className = "era-intro";
  const era = getEra(chapter.era);
  heading.before(panel);
  panel.append(heading);
  for (const [mode, file] of era.artDark ? [["light", era.art], ["dark", era.artDark]] : [["", era.art]]) {
    const image = document.createElement("img");
    image.src = siteUrl(`assets/${file}`);
    image.alt = "";
    image.className = `era-art${mode ? ` era-art-${mode}` : ""}`;
    image.setAttribute("aria-hidden", "true");
    panel.append(image);
  }
}

function renderIllustrations() {
  for (const image of article.querySelectorAll("img[src]")) {
    const illustration = illustrations.find(item => image.src === contentUrl(illustrationPath(item.id, "light")));
    if (!illustration) continue;
    const figure = document.createElement("figure");
    figure.className = "course-illustration";
    figure.dataset.illustration = illustration.id;
    for (const theme of ["light", "dark"]) {
      const link = document.createElement("a");
      link.className = `illustration-version illustration-${theme}`;
      link.href = contentUrl(illustrationPath(illustration.id, theme));
      link.target = "_blank";
      link.rel = "noreferrer";
      link.setAttribute("aria-label", `Open full-size image: ${illustration.title} (new tab)`);
      const img = document.createElement("img");
      img.src = link.href;
      img.alt = illustration.description;
      img.loading = "lazy";
      reportImageFailure(img);
      const label = document.createElement("span");
      label.className = "illustration-open";
      label.textContent = "Open full-size image";
      link.append(img, label);
      figure.append(link);
    }
    const caption = document.createElement("figcaption");
    caption.textContent = illustration.caption;
    const details = document.createElement("details");
    const summary = document.createElement("summary");
    summary.textContent = "Read the illustration";
    const description = document.createElement("p");
    description.textContent = illustration.description;
    details.append(summary, description);
    figure.append(caption, details);
    const parent = image.parentElement;
    if (parent.tagName === "P" && parent.childNodes.length === 1) parent.replaceWith(figure);
    else image.replaceWith(figure);
  }
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
  let routeResolved = false;
  try {
    const { chapter, section } = parseRoute(location.hash);
    const era = chapter.era || referenceEra;
    applyEra(era, document.documentElement.dataset.theme);
    document.querySelector("#chapter-label").textContent = chapter.slug === "overview"
      ? "A .NET course with GitHub Copilot" : chapter.slug === "reference"
      ? "Your course reference" : `${chapter.number} / Core course`;
    document.body.classList.toggle("is-overview", chapter.slug === "overview");
    routeResolved = true;
    const response = await fetch(contentUrl(chapter.path), { signal });
    if (!response.ok) throw new Error(`The lesson could not load (HTTP ${response.status}).`);
    const markdown = await response.text();
    if (signal.aborted) return;
    current = chapter;
    article.innerHTML = DOMPurify.sanitize(marked.parse(markdown, { gfm: true }), { USE_PROFILES: { html: true } });
    rewriteLinks(chapter);
    renderIllustrations();
    if (chapter.slug === "overview") addHero();
    else if (chapter.era) addChapterHeader(chapter);
    buildOutline(chapter);
    addCodeCopy();
    document.body.classList.toggle("is-overview", chapter.slug === "overview");
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
    if (target) {
      for (let ancestor = target.parentElement; ancestor; ancestor = ancestor.parentElement) {
        if (ancestor.tagName === "DETAILS") ancestor.open = true;
      }
      target.scrollIntoView({ behavior: "instant", block: "start" });
    } else window.scrollTo({ top: 0, behavior: "instant" });
  } catch (error) {
    if (signal.aborted) return;
    if (!routeResolved) {
      applyEra(referenceEra, document.documentElement.dataset.theme);
      document.querySelector("#chapter-label").textContent = "Course";
      document.body.classList.remove("is-overview");
    }
    article.removeAttribute("aria-busy");
    article.innerHTML = `<div class="notice" role="alert"><h1>The lesson could not load</h1>
      <p>${escapeHtml(error.message)}</p><button id="retry-lesson" type="button">Try again</button>
      <a href="#/overview">Return to the overview</a></div>`;
    document.querySelector("#retry-lesson").addEventListener("click", () => renderRoute(store));
    console.error(error);
  }
}
