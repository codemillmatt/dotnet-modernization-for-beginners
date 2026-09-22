import { chapters, references } from "./chapters.js";

export function normalizePath(path) {
  const parts = [];
  for (const part of path.replace(/\\/g, "/").split("/")) {
    if (!part || part === ".") continue;
    if (part === "..") {
      if (!parts.length) throw new Error("The link leaves the course.");
      parts.pop();
    } else parts.push(part);
  }
  return parts.join("/");
}

export function parseRoute(hash) {
  const [slug = "overview", query = ""] = hash.replace(/^#\/?/, "").split("?");
  const parameters = new URLSearchParams(query);
  if (slug === "reference") {
    const reference = references.find(item => item.path === parameters.get("path"));
    if (!reference) throw new Error("This reference is not in the course.");
    return { chapter: { ...reference, slug: "reference", number: "Reference" }, section: parameters.get("section") };
  }
  const chapter = chapters.find(item => item.slug === (slug || "overview"));
  if (!chapter) throw new Error("This chapter is not in the course.");
  return { chapter, section: parameters.get("section") };
}

export function routeForPath(path, section = "") {
  const normalized = normalizePath(path);
  const chapter = chapters.find(item => item.path === normalized);
  const params = new URLSearchParams();
  let slug;
  if (chapter) slug = chapter.slug;
  else if (references.some(item => item.path === normalized)) {
    slug = "reference";
    params.set("path", normalized);
  } else return null;
  if (section) params.set("section", section);
  return `#/${slug}${params.size ? `?${params}` : ""}`;
}
