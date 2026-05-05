const http = require("http");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const requestedBase = process.argv[2] ? path.resolve(root, process.argv[2]) : root;
const port = Number(process.env.PORT || 3000);

const routes = new Map([
  ["/", path.join("site", "index.html")],
  ["/client-portal-draft", "pinteq_portal.html"],
  ["/osint-library", "pinteq_osint_library.html"],
  ["/case-intelligence-pipeline", "pinteq_flowchart_pipeline.html"],
  ["/discovery-workflow", "pinteq_flowchart_before_after.html"]
]);

const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml; charset=utf-8"
};

function resolveFile(urlPath) {
  const cleanPath = decodeURIComponent(urlPath.split("?")[0]).replace(/\/+$/, "") || "/";

  if (requestedBase.endsWith("dist")) {
    const relative = cleanPath === "/" ? "index.html" : path.join(cleanPath, "index.html");
    return path.join(requestedBase, relative);
  }

  if (routes.has(cleanPath)) return path.join(root, routes.get(cleanPath));
  return path.join(root, cleanPath);
}

function isInside(child, parent) {
  const relative = path.relative(parent, child);
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}

const server = http.createServer((req, res) => {
  const file = resolveFile(req.url || "/");
  const allowedBase = requestedBase.endsWith("dist") ? requestedBase : root;

  if (!isInside(file, allowedBase) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Not found");
    return;
  }

  const ext = path.extname(file);
  res.writeHead(200, {
    "Content-Type": types[ext] || "application/octet-stream",
    "X-Content-Type-Options": "nosniff"
  });
  fs.createReadStream(file).pipe(res);
});

server.listen(port, () => {
  console.log(`pinteq site available at http://localhost:${port}`);
});
