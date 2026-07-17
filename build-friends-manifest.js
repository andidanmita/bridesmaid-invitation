/* Scans images/friends/<NAME>/ folders and writes images/friends/manifest.json,
   so the Friendship gallery in script.js can build itself from whatever
   photos currently exist on disk — no HTML edits needed when photos are
   added, removed, or a new bridesmaid folder appears. Runs automatically
   on every Netlify build (see netlify.toml); run manually for local preview:
   node build-friends-manifest.js */
const fs = require('fs');
const path = require('path');

const baseDir = path.join(__dirname, 'images', 'friends');
const imgExt = /\.(jpe?g|png|webp)$/i;

const folders = fs.readdirSync(baseDir, { withFileTypes: true })
  .filter(d => d.isDirectory())
  .map(d => d.name)
  .sort((a, b) => a.localeCompare(b));

const manifest = folders.map(name => {
  const dir = path.join(baseDir, name);
  const photos = fs.readdirSync(dir).filter(f => imgExt.test(f)).sort();
  return { name, photos };
});

fs.writeFileSync(path.join(baseDir, 'manifest.json'), JSON.stringify(manifest));

const total = manifest.reduce((sum, g) => sum + g.photos.length, 0);
console.log(`friends manifest: ${manifest.length} folders, ${total} photos`);
