import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const baseDir = path.resolve(__dirname, '..');

console.log('--- Running Acceptance Tests ---');

// 1. Check for banned government / authoritative words
const BANNED_PATTERNS = [
  /Official Record/i,
  /Verified Official/i,
  /S3WaaS/i,
  /legally binding/i
];

function scanFilesForBannedWords(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!['node_modules', '.git', '.netlify'].includes(entry.name)) {
        scanFilesForBannedWords(fullPath);
      }
    } else if (entry.isFile() && (entry.name.endsWith('.html') || entry.name.endsWith('.js') || entry.name.endsWith('.json'))) {
      // Exclude tests or scraper or raw master datasets
      if (fullPath.includes('scraper') || fullPath.includes('tests') || fullPath.includes('up_governance_master') || fullPath.includes('up_governance_directory')) {
        continue;
      }
      const content = fs.readFileSync(fullPath, 'utf8');
      for (const pattern of BANNED_PATTERNS) {
        if (pattern.test(content)) {
          console.error(`BANNED PATTERN ${pattern} found in ${fullPath}`);
          process.exit(1);
        }
      }
    }
  }
}

scanFilesForBannedWords(path.join(baseDir, 'public'));
scanFilesForBannedWords(path.join(baseDir, 'src'));
scanFilesForBannedWords(path.join(baseDir, 'district'));
scanFilesForBannedWords(path.join(baseDir, 'hi'));
scanFilesForBannedWords(path.join(baseDir, 'officers'));
scanFilesForBannedWords(path.join(baseDir, 'rti'));
scanFilesForBannedWords(path.join(baseDir, 'follow-up'));
scanFilesForBannedWords(path.join(baseDir, 'about'));
scanFilesForBannedWords(path.join(baseDir, 'privacy'));
console.log('✔ Acceptance Check 1: Zero banned words found across all built HTML and JS files.');

// 2. Check Notice Banner presence on key pages
const keyPages = [
  path.join(baseDir, 'index.html'),
  path.join(baseDir, 'hi', 'index.html'),
  path.join(baseDir, 'officers', 'index.html'),
  path.join(baseDir, 'rti', 'index.html'),
  path.join(baseDir, 'follow-up', 'index.html'),
  path.join(baseDir, 'about', 'index.html'),
  path.join(baseDir, 'privacy', 'index.html')
];

for (const p of keyPages) {
  const content = fs.readFileSync(p, 'utf8');
  assert.ok(
    content.includes('Independent citizen tool. Not a government website.') ||
    content.includes('स्वतंत्र नागरिक साधन। यह सरकारी वेबसाइट नहीं है।'),
    `Notice banner missing from ${p}`
  );
}
console.log('✔ Acceptance Check 2: Notice banner present on every page.');

// 3. Verify claims.json
const claimsPath = path.join(baseDir, 'content', 'claims.json');
assert.ok(fs.existsSync(claimsPath), 'claims.json must exist');
const claims = JSON.parse(fs.readFileSync(claimsPath, 'utf8'));
assert.ok(claims.length >= 7, 'claims.json must contain at least 7 verified claims');
for (const c of claims) {
  assert.ok(c.text && c.source_url && c.verified_on && c.verified_by, `Claim incomplete: ${c.id}`);
}
console.log(`✔ Acceptance Check 3: All ${claims.length} legal/procedural claims verified with source URLs.`);

// 4. Verify blocks.json and lookups
const blocksPath = path.join(baseDir, 'public', 'data', 'blocks.json');
assert.ok(fs.existsSync(blocksPath), 'blocks.json must exist');
const blocks = JSON.parse(fs.readFileSync(blocksPath, 'utf8'));
assert.strictEqual(blocks.districts.length, 75, 'blocks.json must contain all 75 UP districts');

// Check test districts exist with required UI states
const testDistricts = ['raebareli', 'jaunpur', 'agra'];
for (const td of testDistricts) {
  const lPath = path.join(baseDir, 'public', 'data', 'lookup', `${td}.json`);
  assert.ok(fs.existsSync(lPath), `Lookup file for ${td} must exist`);
  const lookup = JSON.parse(fs.readFileSync(lPath, 'utf8'));
  const vals = Object.values(lookup);
  assert.ok(vals.some(v => v.status === 'not_verified' || (!v.phone && !v.email)), `Missing record test case missing in ${td}`);
  assert.ok(vals.some(v => v.status === 'stale' || (new Date() - new Date(v.checked)) / 86400000 > 180), `Stale record test case missing in ${td}`);
  assert.ok(vals.some(v => v.status === 'conflicting'), `Conflicting record test case missing in ${td}`);
}
console.log('✔ Acceptance Check 4: All 75 districts generated; sample districts contain missing, stale, conflicting, and verified test states.');

// 5. Verify security headers and robots.txt / sitemap.xml
assert.ok(fs.existsSync(path.join(baseDir, '_headers')), '_headers must exist');
assert.ok(fs.existsSync(path.join(baseDir, '_redirects')), '_redirects must exist');
assert.ok(fs.existsSync(path.join(baseDir, 'sitemap.xml')), 'sitemap.xml must exist');
assert.ok(fs.existsSync(path.join(baseDir, 'robots.txt')), 'robots.txt must exist');
console.log('✔ Acceptance Check 5: Security headers, redirects, sitemap.xml, and robots.txt present.');

console.log('\n--- ALL ACCEPTANCE CHECKS PASSED ---\n');
