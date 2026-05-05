'use strict';

const express = require('express');
const fs      = require('fs');
const path    = require('path');

const app  = express();
const PORT = Number(process.env.B4_PORT || 3001);

// ── Data paths ──────────────────────────────────────────────────────────────
const DATA_DIR       = process.env.B4_DATA_DIR || 'C:\\PinteqCaseTesting\\database';
const BRIEFS_DIR     = path.join(DATA_DIR, 'b4_briefs');
const WITNESSES_FILE  = path.join(DATA_DIR, 'b4_witnesses.json');
const PHOTOS_DIR     = path.join(DATA_DIR, 'witness_photos');
const SITE_DIR       = path.join(__dirname, '..', 'site');

// Ensure data directories exist
fs.mkdirSync(BRIEFS_DIR, { recursive: true });
fs.mkdirSync(PHOTOS_DIR, { recursive: true });

// ── Witness seed ─────────────────────────────────────────────────────────────
const WITNESS_SEED = [
  { id: 1,  full_name: 'West',                   role: 'Defendant',                              role_tag: 'defendant', matter_id: 'KENT-25-7082', case_no: 'NSPD 2016-05264' },
  { id: 2,  full_name: 'Cody Laporte',            role: 'Victim (Deceased)',                      role_tag: 'victim',    matter_id: 'KENT-25-7082', case_no: 'NSPD 2016-05264' },
  { id: 3,  full_name: 'Kane Alan Van Raalte',    role: 'Star Prosecution Witness · Incarcerated (MN)', role_tag: 'star',  matter_id: 'KENT-25-7082', case_no: 'NSPD 2016-05264' },
  { id: 4,  full_name: 'Tykeese Childers',        role: 'Key Witness · Phone Dump Subject',       role_tag: 'civilian',  matter_id: 'KENT-25-7082', case_no: 'NSPD 2016-05264' },
  { id: 5,  full_name: 'Christopher Howard',      role: 'Key Witness · Phone Dump Subject',       role_tag: 'civilian',  matter_id: 'KENT-25-7082', case_no: 'NSPD 2016-05264' },
  { id: 6,  full_name: 'Amanda Laporte',          role: 'Civilian Witness',                       role_tag: 'civilian',  matter_id: 'KENT-25-7082', case_no: 'NSPD 2016-05264' },
  { id: 7,  full_name: 'Amber Tjapkes',           role: 'Civilian Witness',                       role_tag: 'civilian',  matter_id: 'KENT-25-7082', case_no: 'NSPD 2016-05264' },
  { id: 8,  full_name: 'Casey Clarke',            role: 'Civilian Witness',                       role_tag: 'civilian',  matter_id: 'KENT-25-7082', case_no: 'NSPD 2016-05264' },
  { id: 9,  full_name: 'Chelsea Pembrook',        role: 'Civilian Witness',                       role_tag: 'civilian',  matter_id: 'KENT-25-7082', case_no: 'NSPD 2016-05264' },
  { id: 10, full_name: 'Christopher Casiano',     role: 'Civilian Witness',                       role_tag: 'civilian',  matter_id: 'KENT-25-7082', case_no: 'NSPD 2016-05264' },
  { id: 11, full_name: 'Craig Anderz',            role: 'Civilian Witness',                       role_tag: 'civilian',  matter_id: 'KENT-25-7082', case_no: 'NSPD 2016-05264' },
  { id: 12, full_name: 'Danielle Frost',          role: 'Civilian Witness',                       role_tag: 'civilian',  matter_id: 'KENT-25-7082', case_no: 'NSPD 2016-05264' },
  { id: 13, full_name: 'Jon Hart',                role: 'Civilian Witness',                       role_tag: 'civilian',  matter_id: 'KENT-25-7082', case_no: 'NSPD 2016-05264' },
  { id: 14, full_name: 'Michael McDermott',       role: 'Civilian Witness',                       role_tag: 'civilian',  matter_id: 'KENT-25-7082', case_no: 'NSPD 2016-05264' },
  { id: 15, full_name: 'Orlando Santiago',        role: 'Civilian Witness',                       role_tag: 'civilian',  matter_id: 'KENT-25-7082', case_no: 'NSPD 2016-05264' },
  { id: 16, full_name: 'Philicia Wahr',           role: 'Civilian Witness',                       role_tag: 'civilian',  matter_id: 'KENT-25-7082', case_no: 'NSPD 2016-05264' },
  { id: 17, full_name: 'Watson',                  role: 'Civilian Witness',                       role_tag: 'civilian',  matter_id: 'KENT-25-7082', case_no: 'NSPD 2016-05264' },
  { id: 18, full_name: 'DeAngelo Pippen',         role: 'DNA Subject',                            role_tag: 'civilian',  matter_id: 'KENT-25-7082', case_no: 'NSPD 2016-05264' },
  { id: 19, full_name: 'Dozier',                  role: 'CODIS DNA Hit',                          role_tag: 'civilian',  matter_id: 'KENT-25-7082', case_no: 'NSPD 2016-05264' },
  { id: 20, full_name: 'Det. Morningstar',        role: 'NSPD Detective',                         role_tag: 'leo',       matter_id: 'KENT-25-7082', case_no: 'NSPD 2016-05264' },
  { id: 21, full_name: 'Ofc. Fulton',             role: 'NSPD Officer · Crime Scene Photos',      role_tag: 'leo',       matter_id: 'KENT-25-7082', case_no: 'NSPD 2016-05264' },
  { id: 22, full_name: 'Ofc. Leach',              role: 'NSPD Officer · Crime Scene Photos',      role_tag: 'leo',       matter_id: 'KENT-25-7082', case_no: 'NSPD 2016-05264' },
  { id: 23, full_name: 'Det. Swanker',            role: 'NSPD Detective · Lead Interviewer',      role_tag: 'leo',       matter_id: 'KENT-25-7082', case_no: 'NSPD 2016-05264' },
  { id: 24, full_name: 'Det. VanderStelt',        role: 'NSPD Detective · Interviewer',           role_tag: 'leo',       matter_id: 'KENT-25-7082', case_no: 'NSPD 2016-05264' },
  { id: 25, full_name: 'Det. Neher',              role: 'NSPD Detective · Interviewer',           role_tag: 'leo',       matter_id: 'KENT-25-7082', case_no: 'NSPD 2016-05264' },
  { id: 26, full_name: 'Det. Blum',               role: 'NSPD Detective · Lab Supplement Author', role_tag: 'forensic',  matter_id: 'KENT-25-7082', case_no: 'NSPD 2016-05264' },
  { id: 27, full_name: 'Sgt. Michelle Robinson',  role: 'FPPD Sergeant',                          role_tag: 'leo',       matter_id: 'KENT-25-7082', case_no: 'NSPD 2016-05264' },
  { id: 28, full_name: 'Babinec',                 role: 'FPPD Officer · Multiple FOIA Cases',     role_tag: 'leo',       matter_id: 'KENT-25-7082', case_no: 'NSPD 2016-05264' },
  { id: 29, full_name: 'Patrick VanDommelen',     role: 'MTPD Detective · Quail Meadows 2015',    role_tag: 'leo',       matter_id: 'KENT-25-7082', case_no: 'NSPD 2016-05264' },
  { id: 30, full_name: 'Al Swanson',              role: 'Attorney · Christopher Howard Counsel',  role_tag: 'attorney',  matter_id: 'KENT-25-7082', case_no: 'NSPD 2016-05264' },
];

// ── Helpers ──────────────────────────────────────────────────────────────────
function loadWitnesses() {
  if (!fs.existsSync(WITNESSES_FILE)) {
    fs.writeFileSync(WITNESSES_FILE, JSON.stringify(WITNESS_SEED, null, 2));
    console.log(`Seeded ${WITNESS_SEED.length} witnesses → ${WITNESSES_FILE}`);
  }
  return JSON.parse(fs.readFileSync(WITNESSES_FILE, 'utf-8'));
}

function briefPath(id) {
  return path.join(BRIEFS_DIR, `${id}.json`);
}

function validateId(id) {
  return /^\d+$/.test(id);
}

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));

// Local-only — allow all loopback variants
const ALLOWED_ORIGINS = [
  `http://localhost:${PORT}`,
  `http://127.0.0.1:${PORT}`,
  `http://[::1]:${PORT}`,
  // Reporting App dev server
  'http://localhost:5174',
  'http://127.0.0.1:5174',
  'http://[::1]:5174',
];
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (!origin || ALLOWED_ORIGINS.includes(origin)) {
    if (origin) res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    if (req.method === 'OPTIONS') { res.sendStatus(204); return; }
    next();
  } else {
    res.status(403).json({ error: 'Cross-origin requests not allowed' });
  }
});

// ── API routes ────────────────────────────────────────────────────────────────

// GET /api/witnesses — full roster
app.get('/api/witnesses', (req, res) => {
  res.json(loadWitnesses());
});

// POST /api/witnesses — add new witness
app.post('/api/witnesses', (req, res) => {
  const witnesses = loadWitnesses();
  const { full_name, role, role_tag, matter_id, case_no } = req.body;
  if (!full_name || typeof full_name !== 'string' || full_name.trim().length === 0) {
    return res.status(400).json({ error: 'full_name required' });
  }
  const newId = witnesses.reduce((max, w) => Math.max(max, w.id), 0) + 1;
  const witness = {
    id: newId,
    full_name: full_name.trim(),
    role: (role || '').trim(),
    role_tag: (role_tag || 'civilian').trim(),
    matter_id: (matter_id || 'KENT-25-7082').trim(),
    case_no: (case_no || 'NSPD 2016-05264').trim(),
  };
  witnesses.push(witness);
  fs.writeFileSync(WITNESSES_FILE, JSON.stringify(witnesses, null, 2));
  res.status(201).json(witness);
});

// GET /api/brief/:id — load saved brief (or empty scaffold)
app.get('/api/brief/:id', (req, res) => {
  if (!validateId(req.params.id)) return res.status(400).json({ error: 'Invalid id' });
  const file = briefPath(req.params.id);
  if (!fs.existsSync(file)) return res.json({ witness_id: req.params.id });
  res.json(JSON.parse(fs.readFileSync(file, 'utf-8')));
});

// POST /api/brief/:id — save brief
app.post('/api/brief/:id', (req, res) => {
  if (!validateId(req.params.id)) return res.status(400).json({ error: 'Invalid id' });
  const data = { ...req.body, witness_id: req.params.id, updated_at: new Date().toISOString() };
  fs.writeFileSync(briefPath(req.params.id), JSON.stringify(data, null, 2));
  res.json({ ok: true, saved_at: data.updated_at });
});

// GET /api/witnesses/:id/photo — serve witness photo
app.get('/api/witnesses/:id/photo', (req, res) => {
  if (!validateId(req.params.id)) return res.status(400).json({ error: 'Invalid id' });
  const exts = ['.jpg', '.jpeg', '.png', '.webp'];
  for (const ext of exts) {
    const file = path.join(PHOTOS_DIR, `${req.params.id}${ext}`);
    if (fs.existsSync(file)) return res.sendFile(file);
  }
  res.status(404).json({ error: 'No photo on file' });
});

// POST /api/witnesses/:id/photo — manual upload (multipart not needed — accept raw body as buffer)
app.post('/api/witnesses/:id/photo', express.raw({ type: ['image/jpeg', 'image/png', 'image/webp'], limit: '5mb' }), (req, res) => {
  if (!validateId(req.params.id)) return res.status(400).json({ error: 'Invalid id' });
  const ct = req.headers['content-type'] || 'image/jpeg';
  const ext = ct.includes('png') ? '.png' : ct.includes('webp') ? '.webp' : '.jpg';
  const dest = path.join(PHOTOS_DIR, `${req.params.id}${ext}`);
  fs.writeFileSync(dest, req.body);
  res.json({ ok: true, path: dest });
});

// POST /api/witnesses/:id/photo/fetch-web — search DDG Images, return candidates (no save)
app.post('/api/witnesses/:id/photo/fetch-web', async (req, res) => {
  if (!validateId(req.params.id)) return res.status(400).json({ error: 'Invalid id' });
  const witnesses = loadWitnesses();
  const witness = witnesses.find(w => String(w.id) === String(req.params.id));
  if (!witness) return res.status(404).json({ error: 'Witness not found' });

  const destBase = path.join(PHOTOS_DIR, String(witness.id));
  const cachedExts = ['.jpg', '.jpeg', '.png', '.webp'];
  if (cachedExts.some(e => fs.existsSync(destBase + e))) return res.json({ status: 'already_have' });

  const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

  try {
    const query = encodeURIComponent(`${witness.full_name} Muskegon Michigan`);

    // Step 1: DuckDuckGo vqd token
    const ddgPage = await fetch(
      `https://duckduckgo.com/?q=${query}&iax=images&ia=images`,
      { headers: { 'User-Agent': UA, 'Accept-Language': 'en-US,en;q=0.9' } }
    );
    const html = await ddgPage.text();
    const vqdMatch = html.match(/vqd=['"]([^'"]+)['"]/);
    if (!vqdMatch) return res.json({ status: 'not_found', message: 'Could not get DDG token' });

    // Step 2: Fetch image results
    const imgApi = await fetch(
      `https://duckduckgo.com/i.js?q=${query}&vqd=${encodeURIComponent(vqdMatch[1])}&f=,,,&p=1&v7exp=a`,
      { headers: { 'User-Agent': UA, 'Accept': 'application/json', 'Referer': 'https://duckduckgo.com/' } }
    );
    if (!imgApi.ok) return res.json({ status: 'not_found', message: `DDG image API ${imgApi.status}` });

    const data = await imgApi.json();
    const candidates = (data.results ?? [])
      .slice(0, 6)
      .map(r => ({ thumb: r.thumbnail, full: r.image, title: r.title || '', source: r.url || '' }))
      .filter(r => r.full && /^https?:\/\//i.test(r.full));

    if (candidates.length === 0) return res.json({ status: 'not_found', message: 'No image results' });

    // Return candidates for user review — do NOT auto-save
    return res.json({ status: 'candidates', candidates });
  } catch (err) {
    console.error('fetch-web error:', err);
    return res.status(500).json({ status: 'error', message: String(err) });
  }
});

// POST /api/witnesses/:id/photo/confirm-web — user approved a candidate URL, download and save
app.post('/api/witnesses/:id/photo/confirm-web', async (req, res) => {
  if (!validateId(req.params.id)) return res.status(400).json({ error: 'Invalid id' });
  const { url } = req.body;
  if (!url || !/^https?:\/\//i.test(url)) return res.status(400).json({ error: 'Invalid URL' });

  const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';
  const destBase = path.join(PHOTOS_DIR, String(req.params.id));

  try {
    const imgRes = await fetch(url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(10000) });
    if (!imgRes.ok) return res.status(502).json({ error: `Download failed: ${imgRes.status}` });

    const ct = imgRes.headers.get('content-type') || '';
    if (!ct.startsWith('image/')) return res.status(400).json({ error: 'URL did not return an image' });

    const ext = ct.includes('png') ? '.png' : ct.includes('webp') ? '.webp' : '.jpg';
    const buf = Buffer.from(await imgRes.arrayBuffer());
    if (buf.length < 1000) return res.status(400).json({ error: 'Image too small' });

    // Remove any previous cached photo for this witness
    for (const e of ['.jpg', '.jpeg', '.png', '.webp']) {
      const prev = destBase + e;
      if (fs.existsSync(prev)) fs.unlinkSync(prev);
    }

    fs.writeFileSync(destBase + ext, buf);
    return res.json({ status: 'saved' });
  } catch (err) {
    return res.status(500).json({ error: String(err) });
  }
});

// POST /api/witnesses/photos/fetch-all — scan discovery source dump for photos
app.post('/api/witnesses/photos/fetch-all', (req, res) => {
  const witnesses = loadWitnesses();
  const SOURCE_ROOT = 'C:\\PinteqCaseTesting\\source_dump';
  const results = [];

  for (const w of witnesses) {
    const exts = ['.jpg', '.jpeg', '.png', '.webp', '.JPG', '.JPEG', '.PNG'];
    const destBase = path.join(PHOTOS_DIR, String(w.id));
    // Already have one?
    const already = exts.some(e => fs.existsSync(destBase + e.toLowerCase()));
    if (already) { results.push({ id: w.id, name: w.full_name, status: 'already_have' }); continue; }

    // Search source dump
    const nameParts = w.full_name.toLowerCase().split(/\s+/).filter(p => p.length > 2);
    let found = null;
    try {
      const walk = (dir) => {
        if (found) return;
        let entries;
        try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
        for (const e of entries) {
          if (found) return;
          const full = path.join(dir, e.name);
          if (e.isDirectory()) { walk(full); continue; }
          const nameLow = e.name.toLowerCase();
          const dirLow  = dir.toLowerCase();
          const isImg = exts.some(x => nameLow.endsWith(x.toLowerCase()));
          if (!isImg) continue;
          const inName = nameParts.some(p => nameLow.includes(p));
          const inDir  = nameParts.some(p => dirLow.includes(p));
          if (inName || inDir) found = full;
        }
      };
      if (fs.existsSync(SOURCE_ROOT)) walk(SOURCE_ROOT);
    } catch { /* skip */ }

    if (found) {
      const ext = path.extname(found).toLowerCase();
      fs.copyFileSync(found, destBase + ext);
      results.push({ id: w.id, name: w.full_name, status: 'found', source: found });
    } else {
      results.push({ id: w.id, name: w.full_name, status: 'not_found' });
    }
  }

  res.json({ results });
});

// GET /api/case — case metadata
app.get('/api/case', (req, res) => {
  res.json({
    case_name: 'People v. West',
    matter_id: 'KENT-25-7082',
    case_no: 'NSPD 2016-05264',
    incident: 'Laporte Homicide',
    jurisdiction: 'Muskegon County',
    defendant: 'West',
    victim: 'Cody Laporte',
  });
});

// ── Static files ──────────────────────────────────────────────────────────────
app.use(express.static(SITE_DIR, { index: false }));

app.get('/', (req, res) => {
  const file = path.join(SITE_DIR, 'b4.html');
  if (!fs.existsSync(file)) return res.status(500).send('b4.html not found');
  res.sendFile(file);
});

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, '0.0.0.0', () => {
  console.log('');
  console.log('  ╔═══════════════════════════════════════════════╗');
  console.log('  ║   B4 WITNESS INTELLIGENCE BRIEF — PINTEQ      ║');
  console.log(`  ║   http://localhost:${PORT}                        ║`);
  console.log('  ║   People v. West · KENT-25-7082               ║');
  console.log('  ║   Work Product · Attorney Privileged           ║');
  console.log('  ╚═══════════════════════════════════════════════╝');
  console.log('');
  console.log(`  Data dir : ${DATA_DIR}`);
  console.log(`  Briefs   : ${BRIEFS_DIR}`);
  console.log('');
});
