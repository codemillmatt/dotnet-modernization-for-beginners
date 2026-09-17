import { chapters } from "./chapters.js";

const lessonIds = chapters.filter(chapter => chapter.slug !== "overview").map(chapter => chapter.slug);
const validIds = values => Array.isArray(values) ? [...new Set(values.filter(value => lessonIds.includes(value)))] : [];
const fresh = () => ({ version: 2, completed: [], previousReading: [], lastVisited: "", theme: "light" });

export function createProgressStore(storage, key) {
  let state = fresh();
  let warning = "";
  const storageWarning = "Your browser cannot save progress. Changes last for this visit only.";
  function save() {
    try { storage.setItem(key, JSON.stringify(state)); } catch { warning = storageWarning; }
  }
  try {
    const raw = storage.getItem(key);
    if (raw) {
      const saved = JSON.parse(raw);
      if (saved?.version !== 2) throw new Error("Unsupported progress format.");
      if (!Array.isArray(saved.completed) || !Array.isArray(saved.previousReading)
          || typeof saved.lastVisited !== "string" || !["light", "dark"].includes(saved.theme)) {
        throw new Error("Invalid progress fields.");
      }
      state = {
        version: 2, completed: validIds(saved.completed), previousReading: validIds(saved.previousReading),
        lastVisited: lessonIds.includes(saved.lastVisited) ? saved.lastVisited : "",
        theme: saved.theme === "dark" ? "dark" : "light"
      };
    } else {
      const legacy = storage.getItem("dotnet-modernization-course-progress");
      if (legacy) {
        const reading = JSON.parse(legacy);
        if (!Array.isArray(reading)) throw new Error("Invalid previous reading marks.");
        state.previousReading = validIds(reading);
      }
      save();
    }
  } catch {
    warning = "Your browser could not read saved progress. Changes last for this visit unless saving succeeds.";
  }
  return {
    get value() { return structuredClone(state); },
    get warning() { return warning; },
    toggle(slug) {
      if (!lessonIds.includes(slug)) throw new Error("Unknown chapter.");
      state.completed = state.completed.includes(slug)
        ? state.completed.filter(value => value !== slug) : [...state.completed, slug];
      save();
    },
    visit(slug) {
      if (!lessonIds.includes(slug)) return;
      state.lastVisited = slug;
      save();
    },
    theme(value) {
      if (!["light", "dark"].includes(value)) throw new Error("Unknown theme.");
      state.theme = value;
      save();
    },
    reset() {
      const theme = state.theme;
      state = { ...fresh(), theme };
      save();
    }
  };
}
