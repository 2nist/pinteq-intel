const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const dist = path.join(root, "dist");

const pages = [
  {
    source: path.join("Reporting_App", "index.html"),
    output: "index.html",
    canonical: "https://pinteq.co/",
    description:
      "Pinteq builds practical intelligence workflows, OSINT research, and client-ready reporting systems."
  }
];

function ensureInside(child, parent) {
  const relative = path.relative(parent, child);
  return relative && !relative.startsWith("..") && !path.isAbsolute(relative);
}

function injectHead(html, page) {
  const meta = `
<meta name="description" content="${page.description}">
<link rel="canonical" href="${page.canonical}">
<meta property="og:site_name" content="pinteq">
<meta property="og:type" content="website">
<meta property="og:url" content="${page.canonical}">
<meta property="og:description" content="${page.description}">
<meta name="twitter:card" content="summary">`;

  if (html.includes('name="description"')) return html;
  return html.replace("</title>", `</title>${meta}`);
}

fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(dist, { recursive: true });

for (const page of pages) {
  const source = path.join(root, page.source);
  const output = path.join(dist, page.output);

  if (!ensureInside(output, dist)) {
    throw new Error(`Refusing to write outside dist: ${output}`);
  }

  const html = fs.readFileSync(source, "utf8");
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, injectHead(html, page));
}

fs.writeFileSync(
  path.join(dist, "robots.txt"),
  "User-agent: *\nAllow: /\nSitemap: https://pinteq.co/sitemap.xml\n"
);

fs.writeFileSync(
  path.join(dist, "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages
  .map(
    page => `  <url>
    <loc>${page.canonical}</loc>
  </url>`
  )
  .join("\n")}
</urlset>
`
);

console.log(`Built ${pages.length} public page into ${path.relative(root, dist)}`);

