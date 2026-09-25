const repositoryOnlyBlock = /<!-- repo-only:start -->[\s\S]*?<!-- repo-only:end -->\r?\n?/g;
const startMarker = "<!-- repo-only:start -->";
const endMarker = "<!-- repo-only:end -->";

export function stripRepositoryOnlySections(markdown, path = "Markdown") {
  const starts = markdown.split(startMarker).length - 1;
  const ends = markdown.split(endMarker).length - 1;
  if (starts !== ends) {
    throw new Error(`Repository-only Markdown markers are unbalanced in ${path}.`);
  }
  return markdown.replace(repositoryOnlyBlock, "");
}
