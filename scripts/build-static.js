const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const root = path.resolve(__dirname, "..");
const reportingApp = path.join(root, "Reporting_App");
const dist = path.join(root, "dist");

// Clean dist directory
fs.rmSync(dist, { recursive: true, force: true });

// Build the Reporting_App Vite application
console.log("Building Reporting_App...");
try {
  execSync("npm run build", {
    cwd: reportingApp,
    stdio: "inherit"
  });
} catch (error) {
  console.error("Failed to build Reporting_App");
  process.exit(1);
}

// Copy the built Vite output to dist
const reportingDist = path.join(reportingApp, "dist");
if (!fs.existsSync(reportingDist)) {
  console.error("Reporting_App dist not found after build");
  process.exit(1);
}

console.log("Copying build output to dist/...");
fs.cpSync(reportingDist, dist, { recursive: true });

// Add SEO files
fs.writeFileSync(
  path.join(dist, "robots.txt"),
  "User-agent: *\nAllow: /\nSitemap: https://intel.pinteq.co/sitemap.xml\n"
);

fs.writeFileSync(
  path.join(dist, "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://intel.pinteq.co/</loc>
  </url>
</urlset>
`
);

console.log("Build complete!");

