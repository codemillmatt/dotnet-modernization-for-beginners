import {
  chapterPager,
  chaptersToggle,
  courseNavPanel,
  drawerBackdrop,
  outlinePanel,
  outlineToggle,
  prerequisitesCheckpoint,
  themeToggle
} from "./scripts/dom.js";
import { getCurrentChapter, renderRoute } from "./scripts/reader.js";
import { toggleChapterCompletion, togglePrerequisitesComplete } from "./scripts/state.js";
import {
  closeDrawers,
  handleDrawerKeydown,
  openDrawer,
  renderChapterNav,
  renderPager,
  renderPrerequisitesCheckpoint,
  toggleTheme,
  updateReadingProgress
} from "./scripts/ui.js";

marked.use({ breaks: false, gfm: true });
mermaid.initialize({
  startOnLoad: false,
  securityLevel: "strict",
  theme: document.documentElement.dataset.theme === "dark" ? "dark" : "neutral"
});

themeToggle.addEventListener("click", toggleTheme);
chaptersToggle.addEventListener("click", () => {
  if (courseNavPanel.classList.contains("is-open")) closeDrawers();
  else openDrawer(courseNavPanel, chaptersToggle);
});
outlineToggle.addEventListener("click", () => {
  if (outlinePanel.classList.contains("is-open")) closeDrawers();
  else openDrawer(outlinePanel, outlineToggle);
});
drawerBackdrop.addEventListener("click", closeDrawers);
prerequisitesCheckpoint.addEventListener("click", () => {
  togglePrerequisitesComplete();
  renderPrerequisitesCheckpoint();
});
chapterPager.addEventListener("click", (event) => {
  const button = event.target.closest("[data-complete-chapter]");
  if (!button) return;

  toggleChapterCompletion(button.dataset.completeChapter);
  const chapter = getCurrentChapter();
  renderChapterNav(chapter);
  renderPager(chapter);
});
document.addEventListener("keydown", (event) => {
  handleDrawerKeydown(event);
});
window.addEventListener("hashchange", renderRoute);
window.addEventListener("scroll", updateReadingProgress, { passive: true });
window.addEventListener("resize", () => {
  closeDrawers();
  updateReadingProgress();
});

lucide.createIcons();
renderPrerequisitesCheckpoint();
if (!window.location.hash) window.location.hash = "/overview";
else renderRoute();
