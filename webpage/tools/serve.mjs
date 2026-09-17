import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { dirname, extname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

const { values } = parseArgs({ options: {
  port: { type: "string", default: "4173" },
  base: { type: "string", default: "/" }
} });
const port = Number(values.port);
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error("Use a valid TCP port.");
const base = values.base;
if (!/^\/(?:[a-zA-Z0-9_-]+\/)*$/.test(base)) throw new Error("Use a base path such as /workshop/.");
const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../_site");
await stat(resolve(root, "index.html"));
const types = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png",
  ".woff2": "font/woff2", ".zip": "application/zip"
};
const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url, "http://localhost");
    if (!url.pathname.startsWith(base)) { response.writeHead(404).end("The file does not exist."); return; }
    const path = decodeURIComponent(url.pathname.slice(base.length));
    const file = resolve(root, path.endsWith("/") || !path ? `${path}index.html` : path);
    if (!file.startsWith(root + sep)) { response.writeHead(403).end("The path is not allowed."); return; }
    const data = await readFile(file);
    response.writeHead(200, { "Content-Type": types[extname(file)] || "text/plain; charset=utf-8", "X-Content-Type-Options": "nosniff" });
    response.end(data);
  } catch (error) {
    if (error.code === "ENOENT" || error.code === "EISDIR") response.writeHead(404).end("The file does not exist.");
    else if (error instanceof URIError) response.writeHead(400).end("The path is invalid.");
    else { console.error(error); response.writeHead(500).end("The server could not read the file."); }
  }
});
server.listen(port, "127.0.0.1", () => console.log(`Workshop preview: http://127.0.0.1:${port}${base}`));
process.on("SIGTERM", () => server.close());
process.on("SIGINT", () => server.close());
