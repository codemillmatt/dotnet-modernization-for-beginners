export { chapters, references } from "./chapters.js";
export const siteRoot = new URL(".", document.baseURI);
export const contentUrl = path => new URL(`content/${path}`, siteRoot).href;
export const siteUrl = path => new URL(path, siteRoot).href;
export const completionKey = `dotnet-modernization-workshop:v2:${siteRoot.pathname}`;
