import http from "node:http";
import { readFile } from "node:fs/promises";
import { resolve, extname, sep } from "node:path";
const args = process.argv.slice(2);
const option = (key, fallback) =>
  args.includes(key) ? args[args.indexOf(key) + 1] : fallback;
const root = resolve(new URL("..", import.meta.url).pathname);
const types = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".png": "image/png",
  ".svg": "image/svg+xml",
};
http
  .createServer(async (req, res) => {
    try {
      const path = resolve(
        root,
        "." + decodeURIComponent(new URL(req.url, "http://localhost").pathname),
      );
      if (path !== root && !path.startsWith(root + sep)) {
        res.writeHead(403).end();
        return;
      }
      const file = path === root ? resolve(root, "index.html") : path;
      const content = await readFile(file);
      res
        .writeHead(200, {
          "Content-Type": types[extname(file)] || "application/octet-stream",
          "Cache-Control": "no-store",
        })
        .end(content);
    } catch {
      res.writeHead(404).end("Not found");
    }
  })
  .listen(Number(option("--port", 8000)), option("--host", "127.0.0.1"), () =>
    console.log("Town preview ready"),
  );
