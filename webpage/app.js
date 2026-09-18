import { completionKey } from "./scripts/config.js";
import { createProgressStore } from "./scripts/state.js";
import { getCurrentChapter, renderRoute } from "./scripts/reader.js";
import { closeDrawers, handleDrawerKey, renderPager, renderProgress, setTheme, syncDrawers, toggleDrawer } from "./scripts/ui.js";
import { chaptersToggle, outlineToggle, courseNavPanel, outlinePanel, themeToggle, drawerBackdrop, chapterPager } from "./scripts/dom.js";

const storage = {
  getItem: key => window.localStorage.getItem(key),
  setItem: (key, value) => window.localStorage.setItem(key, value)
};
const store = createProgressStore(storage, completionKey);
const header = document.querySelector(".site-header");
new ResizeObserver(() => {
  document.documentElement.style.setProperty("--header-height", `${header.getBoundingClientRect().height}px`);
}).observe(header);
const requestedTheme = new URLSearchParams(location.search).get("clawpilotTheme");
setTheme(["light", "dark"].includes(requestedTheme) ? requestedTheme : store.value.theme, store);
themeToggle.addEventListener("click", () => {
  const theme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  const url = new URL(location.href);
  url.searchParams.delete("clawpilotTheme");
  history.replaceState(null, "", url);
  setTheme(theme, store);
  renderProgress(store, getCurrentChapter());
});
chaptersToggle.addEventListener("click", () => toggleDrawer(courseNavPanel, chaptersToggle));
outlineToggle.addEventListener("click", () => toggleDrawer(outlinePanel, outlineToggle));
drawerBackdrop.addEventListener("click", () => closeDrawers(true));
document.addEventListener("keydown", handleDrawerKey);
window.addEventListener("resize", () => { closeDrawers(); syncDrawers(); });
document.querySelector(".skip-link").addEventListener("click", event => {
  event.preventDefault();
  closeDrawers();
  document.querySelector("#main-content").focus();
});
chapterPager.addEventListener("click", event => {
  const button = event.target.closest("[data-complete]");
  if (!button) return;
  store.toggle(button.dataset.complete);
  renderProgress(store, getCurrentChapter());
  renderPager(getCurrentChapter(), store);
  chapterPager.querySelector("[data-complete]")?.focus();
});
document.querySelector("#reset-progress").addEventListener("click", () => {
  if (!window.confirm("Reset this course's progress? This keeps your theme and does not change your code or other browser data.")) return;
  store.reset();
  renderProgress(store, getCurrentChapter());
  renderPager(getCurrentChapter(), store);
});
window.addEventListener("hashchange", () => renderRoute(store));
syncDrawers();
if (!location.hash) history.replaceState(null, "", `${location.pathname}${location.search}#/overview`);
renderRoute(store);
