# pinteq.co

Initial static website for Pinteq.

## Local Development

```powershell
npm run dev
```

Open `http://localhost:3000`.

Available local routes:

- `/` - public website
- `/osint-library` - OSINT source library draft
- `/case-intelligence-pipeline` - pipeline flowchart
- `/discovery-workflow` - before/after workflow

## Build

```powershell
npm run build
npm run preview
```

The production build is written to `dist/`. Only the clean public website is copied there. Draft portal, OSINT, flowchart, and `.docx` working files remain local until they are reviewed for public/private handling.

## Vercel

This project is configured as a static site:

- Build command: `npm run build`
- Output directory: `dist`
- Node version: `20.x` or newer

The `.docx` files in this working folder are business/client materials and are intentionally not copied into `dist/`.
