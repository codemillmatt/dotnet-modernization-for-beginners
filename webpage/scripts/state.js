import { chapters } from "./chapters.js";

const lessonIds = chapters.filter(chapter => chapter.slug !== "overview").map(chapter => chapter.slug);
const validIds = values => Array.isArray(values) ? [...new Set(values.filter(value => lessonIds.includes(value)))] : [];
const revisionFor = slug => chapters.find(chapter => chapter.slug === slug)?.exerciseRevision;
const fresh = () => ({
  version: 3, completed: [], completionRevisions: {}, previousCompleted: [],
  previousReading: [], lastVisited: "", theme: "light"
});

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
      state.theme = saved?.theme === "dark" ? "dark" : "light";
      state.lastVisited = lessonIds.includes(saved?.lastVisited) ? saved.lastVisited : "";
      if (![2, 3].includes(saved?.version) || !Array.isArray(saved.completed)
          || !Array.isArray(saved.previousReading)) throw new Error("Invalid progress fields.");
      state.previousReading = validIds(saved.previousReading);
      const archive = (slug, revision) => {
        if (!lessonIds.includes(slug) || !Number.isInteger(revision) || revision < 1) return;
        if (!state.previousCompleted.some(item => item.slug === slug && item.revision === revision)) {
          state.previousCompleted.push({ slug, revision });
        }
      };
      for (const item of Array.isArray(saved.previousCompleted) ? saved.previousCompleted : []) {
        archive(item?.slug, item?.revision);
      }
      for (const slug of validIds(saved.completed)) {
        const revision = saved.version === 2 ? 1 : saved.completionRevisions?.[slug];
        if (revision === revisionFor(slug)) {
          state.completed.push(slug);
          state.completionRevisions[slug] = revision;
        } else archive(slug, Number.isInteger(revision) && revision > 0 ? revision : 1);
      }
      save();
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
      if (state.completed.includes(slug)) state.completionRevisions[slug] = revisionFor(slug);
      else delete state.completionRevisions[slug];
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
