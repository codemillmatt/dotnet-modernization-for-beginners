import { chapters } from "./config.js";
import {
  article,
  chapterNav,
  chapterPager,
  chaptersToggle,
  courseNavPanel,
  courseProgress,
  outlineNav,
  outlinePanel,
  outlineToggle,
  prerequisitesCheckpoint,
  progressBar
} from "./dom.js";
import { getCompletedChapters, getPrerequisitesComplete } from "./state.js";

let activeDrawer = null;
let drawerToggle = null;

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function escapeHtml(value) {
  const element = document.createElement("span");
  element.textContent = value;
  return element.innerHTML;
}

export function renderChapterNav(activeChapter) {
  const completed = getCompletedChapters();
  const completedCount = chapters.slice(1).filter((chapter) => completed.has(chapter.slug)).length;
  courseProgress.textContent = `${completedCount} of ${chapters.length - 1} chapter exercises completed`;

  chapterNav.innerHTML = `
    <ol class="chapter-list">
      ${chapters.map((chapter) => `
        <li>
          <a class="chapter-link" href="#/${chapter.slug}" ${chapter === activeChapter ? 'aria-current="page"' : ""}>
            <span class="chapter-number ${completed.has(chapter.slug) ? "is-complete" : ""}" aria-hidden="true">${completed.has(chapter.slug) ? "&#10003;" : chapter.number}</span>
            <span>${chapter.title}</span>
            ${completed.has(chapter.slug) ? '<span class="sr-only">Completed</span>' : ""}
          </a>
        </li>
      `).join("")}
    </ol>
  `;
}

export function buildOutline(chapter) {
  const headings = [...article.querySelectorAll("h2, h3")];
  const usedIds = new Map();

  article.querySelectorAll("h1, h2, h3, h4").forEach((heading) => {
    const baseId = slugify(heading.textContent) || "section";
    const count = usedIds.get(baseId) || 0;
    usedIds.set(baseId, count + 1);
    heading.id = count ? `${baseId}-${count + 1}` : baseId;
  });

  outlineNav.innerHTML = headings.length
    ? `<ol class="outline-list">${headings.map((heading) => `
        <li>
          <a class="outline-link depth-${heading.tagName.slice(1)}" data-section="${heading.id}" href="#/${chapter.slug}?section=${encodeURIComponent(heading.id)}">${escapeHtml(heading.textContent)}</a>
        </li>
      `).join("")}</ol>`
    : "";
}

export function renderPager(activeChapter) {
  const index = chapters.indexOf(activeChapter);
  if (index < 0) {
    chapterPager.innerHTML = "";
    return;
  }
  const previous = chapters[index - 1];
  const next = chapters[index + 1];
  const isComplete = getCompletedChapters().has(activeChapter.slug);

  chapterPager.innerHTML = `
    ${index > 0 ? `
      <div class="chapter-completion">
        <span>Completed this chapter's learner artifact?</span>
        <button class="completion-button" type="button" data-complete-chapter="${activeChapter.slug}" aria-pressed="${isComplete}">
          <i data-lucide="${isComplete ? "circle-check-big" : "circle"}" aria-hidden="true"></i>
          ${isComplete ? "Exercise completed" : "Mark exercise complete"}
        </button>
      </div>` : ""}
    <div class="pager-grid">
      ${previous ? `
        <a class="pager-link" href="#/${previous.slug}">
          <span class="pager-label">Previous</span>
          <strong>${previous.title}</strong>
        </a>` : "<span></span>"}
      ${next ? `
        <a class="pager-link" href="#/${next.slug}">
          <span class="pager-label">Next</span>
          <strong>${next.title}</strong>
        </a>` : ""}
    </div>
  `;

  lucide.createIcons({ attrs: { "aria-hidden": "true" } });
}

export function updateReadingProgress() {
  const articleTop = article.offsetTop;
  const scrollable = Math.max(article.offsetHeight - window.innerHeight, 1);
  const progress = Math.min(Math.max((window.scrollY - articleTop) / scrollable, 0), 1);
  progressBar.style.width = `${progress * 100}%`;

  const headings = [...article.querySelectorAll("h2, h3")];
  const activeHeading = headings.filter((heading) => heading.getBoundingClientRect().top <= 140).at(-1);
  outlineNav.querySelectorAll(".outline-link").forEach((link) => {
    if (link.dataset.section === activeHeading?.id) link.setAttribute("aria-current", "location");
    else link.removeAttribute("aria-current");
  });
}

export function toggleTheme() {
  const current = document.documentElement.dataset.theme;
  const url = new URL(window.location.href);
  url.searchParams.set("clawpilotTheme", current === "dark" ? "light" : "dark");
  window.location.replace(url);
}

export function closeDrawers() {
  const focusTarget = drawerToggle;
  courseNavPanel.classList.remove("is-open");
  outlinePanel.classList.remove("is-open");
  document.body.classList.remove("drawer-open");
  chaptersToggle.setAttribute("aria-expanded", "false");
  outlineToggle.setAttribute("aria-expanded", "false");
  const isMobile = window.matchMedia("(max-width: 52rem)").matches;
  document.querySelector(".site-header").inert = false;
  document.querySelector("#main-content").inert = false;
  courseNavPanel.inert = isMobile;
  outlinePanel.inert = isMobile;

  if (activeDrawer) {
    activeDrawer.removeAttribute("aria-modal");
    activeDrawer.removeAttribute("role");
    activeDrawer.removeAttribute("tabindex");
  }
  activeDrawer = null;
  drawerToggle = null;

  if (focusTarget && document.contains(focusTarget)) {
    focusTarget.focus();
  }
}

export function openDrawer(panel, toggle) {
  closeDrawers();
  activeDrawer = panel;
  drawerToggle = toggle;
  panel.classList.add("is-open");
  panel.inert = false;
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-modal", "true");
  panel.setAttribute("tabindex", "-1");
  document.body.classList.add("drawer-open");
  toggle.setAttribute("aria-expanded", "true");

  [document.querySelector(".site-header"), document.querySelector("#main-content"), courseNavPanel, outlinePanel]
    .filter((element) => element && element !== panel)
    .forEach((element) => {
      element.inert = true;
    });

  const firstFocusable = panel.querySelector("a[href], button:not([disabled]), [tabindex]:not([tabindex='-1'])");
  (firstFocusable || panel).focus();
}

export function handleDrawerKeydown(event) {
  if (!activeDrawer) return;

  if (event.key === "Escape") {
    event.preventDefault();
    closeDrawers();
    return;
  }

  if (event.key !== "Tab") return;

  const focusable = [...activeDrawer.querySelectorAll("a[href], button:not([disabled]), [tabindex]:not([tabindex='-1'])")]
    .filter((element) => !element.hidden);
  if (!focusable.length) {
    event.preventDefault();
    activeDrawer.focus();
    return;
  }

  const first = focusable[0];
  const last = focusable.at(-1);
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

export function renderPrerequisitesCheckpoint() {
  const complete = getPrerequisitesComplete();
  prerequisitesCheckpoint.setAttribute("aria-pressed", String(complete));
  prerequisitesCheckpoint.innerHTML = `
    <i data-lucide="${complete ? "circle-check-big" : "circle"}" aria-hidden="true"></i>
    <span>${complete ? "Prerequisites verified" : "Prerequisites not yet verified"}</span>
  `;
  lucide.createIcons({ attrs: { "aria-hidden": "true" } });
}
