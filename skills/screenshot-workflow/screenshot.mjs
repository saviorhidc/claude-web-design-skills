#!/usr/bin/env node
// screenshot.mjs
//
// Capture a full-page screenshot of a URL via Puppeteer and save it to
// ./.screenshots/. Filenames auto-increment so prior shots are
// never overwritten. Optional label suffix appends to the filename.
//
// Before capturing, scrolls the page to the bottom in steps to trigger any
// IntersectionObserver-driven animations (Framer Motion `whileInView`,
// CSS scroll reveals, etc.), then scrolls back to top. Without this, motion-
// rich sites screenshot with empty gaps where reveals never fired.
//
// Usage:
//   node screenshot.mjs <url> [label] [--allow-remote]
//
// Examples:
//   node screenshot.mjs http://localhost:3000
//   node screenshot.mjs http://localhost:3000 hero-section
//   node screenshot.mjs https://example.com after-fix --allow-remote
//
// After running, use Claude Code's Read tool on the saved PNG path —
// Claude can see and analyze the image directly.

import puppeteer from 'puppeteer';
import fs from 'node:fs/promises';
import path from 'node:path';

// --- URL validation (SSRF protection) ---
const allowRemote = process.argv.includes('--allow-remote');

// Find the URL: first arg that starts with http
const rawUrl = process.argv.slice(2).find(arg => arg.startsWith('http'));
if (!rawUrl) {
  console.error('Usage: node screenshot.mjs <url> [label] [--allow-remote]');
  console.error('Example: node screenshot.mjs http://localhost:3000 hero');
  process.exit(1);
}

let parsed;
try {
  parsed = new URL(rawUrl);
} catch {
  console.error(`Invalid URL: ${rawUrl}`);
  process.exit(1);
}

if (!['http:', 'https:'].includes(parsed.protocol)) {
  console.error(`Only http/https URLs allowed. Got: ${parsed.protocol}`);
  process.exit(1);
}

if (!allowRemote) {
  const allowed = ['localhost', '127.0.0.1', '::1'];
  if (!allowed.includes(parsed.hostname)) {
    console.error(`Remote URLs blocked. Pass --allow-remote to enable: ${parsed.hostname}`);
    process.exit(1);
  }
} else {
  console.warn('⚠ --allow-remote enabled: use only in trusted environments');
}

// --- Arg parsing ---
// Collect non-flag, non-URL args as label
const args = process.argv.slice(2).filter(arg => !arg.startsWith('http') && arg !== '--allow-remote');
const label = args[0] || null;

// Viewport presets — when the label matches one of these, the screenshot
// captures at that device's dimensions. Otherwise falls back to desktop.
const VIEWPORTS = {
  mobile:  { width: 390,  height: 844,  deviceScaleFactor: 2 }, // iPhone 14
  tablet:  { width: 768,  height: 1024, deviceScaleFactor: 2 }, // iPad Mini
  desktop: { width: 1280, height: 800,  deviceScaleFactor: 2 }, // default
};

const outDir = path.join(process.cwd(), '.screenshots');
await fs.mkdir(outDir, { recursive: true });

const files = await fs.readdir(outDir).catch(() => []);
const nums = files
  .map((f) => {
    const match = f.match(/^screenshot-(\d+)/);
    return match ? parseInt(match[1], 10) : null;
  })
  .filter((n) => n !== null);
const next = nums.length ? Math.max(...nums) + 1 : 1;

const safeLabel = label ? label.replace(/[^a-zA-Z0-9-_]/g, '-') : null;
const filename = safeLabel
  ? `screenshot-${next}-${safeLabel}.png`
  : `screenshot-${next}.png`;
const filepath = path.join(outDir, filename);

const browser = await puppeteer.launch({ headless: true });
try {
  const page = await browser.newPage();
  const viewport = (label && VIEWPORTS[label]) ? VIEWPORTS[label] : VIEWPORTS.desktop;
  await page.setViewport(viewport);
  // networkidle2 (≤2 in-flight) — networkidle0 hangs on dev-server HMR websockets
  await page.goto(rawUrl, { waitUntil: 'networkidle2', timeout: 30000 });

  // Wait for client-side hydration (especially important for Next.js dev mode)
  await new Promise((r) => setTimeout(r, 2000));

  // Trigger scroll-based animations (IntersectionObserver, Framer Motion whileInView)
  // Slow stepped scroll so each section sits in viewport for at least one frame.
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      let total = 0;
      let count = 0;
      const step = 250;
      const maxScrolls = 200; // guard against infinite-scroll pages
      const interval = setInterval(() => {
        const max = document.body.scrollHeight;
        window.scrollBy(0, step);
        total += step;
        count++;
        if (total >= max + 1000 || count >= maxScrolls) {
          clearInterval(interval);
          resolve();
        }
      }, 150);
    });
  });

  // Let final reveal animations complete
  await new Promise((r) => setTimeout(r, 1500));

  // Scroll back to top so fullPage screenshot starts cleanly from the top
  await page.evaluate(() => window.scrollTo(0, 0));
  await new Promise((r) => setTimeout(r, 600));

  await page.screenshot({ path: filepath, fullPage: true });
  console.log(`Saved ${filepath}`);
} finally {
  await browser.close();
}
