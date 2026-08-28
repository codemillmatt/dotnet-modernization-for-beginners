import { completionKey, prerequisitesKey } from "./config.js";

let prerequisitesFallback = false;
let completedFallback = new Set();
let storageAvailable = true;

export function getCompletedChapters() {
  if (!storageAvailable) return new Set(completedFallback);

  try {
    completedFallback = new Set(JSON.parse(localStorage.getItem(completionKey)) || []);
    return new Set(completedFallback);
  } catch {
    storageAvailable = false;
    return new Set(completedFallback);
  }
}

export function toggleChapterCompletion(slug) {
  const completed = getCompletedChapters();

  if (completed.has(slug)) completed.delete(slug);
  else completed.add(slug);

  completedFallback = new Set(completed);
  try {
    localStorage.setItem(completionKey, JSON.stringify([...completed]));
  } catch {
    storageAvailable = false;
    // Exercise progress remains available in memory when storage is unavailable.
  }
}

export function getPrerequisitesComplete() {
  if (!storageAvailable) return prerequisitesFallback;

  try {
    prerequisitesFallback = localStorage.getItem(prerequisitesKey) === "true";
    return prerequisitesFallback;
  } catch {
    storageAvailable = false;
    return prerequisitesFallback;
  }
}

export function togglePrerequisitesComplete() {
  const complete = !getPrerequisitesComplete();
  prerequisitesFallback = complete;
  try {
    localStorage.setItem(prerequisitesKey, String(complete));
  } catch {
    storageAvailable = false;
    // The checkpoint still works for this page when browser storage is unavailable.
  }
  return complete;
}
