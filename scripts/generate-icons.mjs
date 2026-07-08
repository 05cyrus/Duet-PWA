/**
 * Generates PWA icons from an inline SVG using sharp.
 * Run: node scripts/generate-icons.mjs
 */
import sharp from "sharp";
import { mkdir } from "fs/promises";

const svg = (padding = 0) => `
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#fb7195"/>
      <stop offset="55%" stop-color="#f43f6e"/>
      <stop offset="100%" stop-color="#8b5cf6"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="${padding ? 0 : 116}" fill="url(#bg)"/>
  <g transform="translate(256 268) scale(${padding ? 0.72 : 0.92}) translate(-256 -268)">
    <path d="M256 372c-64-51-118-88-118-140 0-37 29-64 64-64 22 0 42 11 54 29 12-18 32-29 54-29 35 0 64 27 64 64 0 52-54 89-118 140z"
      fill="#ffffff"/>
    <path d="M204 208c-10 0-18 8-18 18" stroke="#f43f6e" stroke-width="14" stroke-linecap="round" fill="none" opacity="0.9"/>
  </g>
</svg>`;

await mkdir("public/icons", { recursive: true });

const jobs = [
  { file: "public/icons/icon-192.png", size: 192, pad: false },
  { file: "public/icons/icon-512.png", size: 512, pad: false },
  { file: "public/icons/maskable-512.png", size: 512, pad: true },
  { file: "public/icons/apple-touch-icon.png", size: 180, pad: false },
];

for (const job of jobs) {
  await sharp(Buffer.from(svg(job.pad ? 1 : 0)))
    .resize(job.size, job.size)
    .png()
    .toFile(job.file);
  console.log("✓", job.file);
}
console.log("Icons generated.");
