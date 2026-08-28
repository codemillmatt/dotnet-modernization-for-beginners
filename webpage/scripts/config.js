export const chapters = [
  { slug: "overview", number: "S", title: "Course overview", path: "README.md" },
  { slug: "00-introduction", number: "00", title: "Introduction", path: "00-introduction/README.md" },
  { slug: "01-assessment", number: "01", title: "Assessment", path: "01-assessment/README.md" },
  { slug: "02-planning", number: "02", title: "Planning", path: "02-planning/README.md" },
  { slug: "03-upgrade-execution", number: "03", title: "Upgrade execution", path: "03-upgrade-execution/README.md" },
  { slug: "04-cloud", number: "04", title: "Going to the cloud", path: "04-cloud/README.md" }
];

export const supplementalPages = [
  { slug: "bookcatalog-baseline", title: "BookCatalog baseline", path: "shared-legacy-app/README.md" },
  { slug: "behavior-contract", title: "BookCatalog behavior contract", path: "shared-legacy-app/BEHAVIOR-CONTRACT.md" }
];

export const completionKey = "dotnet-modernization-course-progress";
export const prerequisitesKey = "dotnet-modernization-prerequisites-complete";

const sourcePreview = /\/webpage(?:\/index\.html)?\/?$/.test(window.location.pathname);
const contentRoot = new URL(sourcePreview ? "../" : "content/", document.baseURI);

export function contentUrl(path) {
  return new URL(path, contentRoot).href;
}
