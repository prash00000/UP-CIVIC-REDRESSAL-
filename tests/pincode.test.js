import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { cleanPostOfficeName, lookupPincode } from '../src/lib/pincode.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Mock fetchFn using local public/data/pincode directory
async function mockFetch(url) {
  const rel = url.replace('/data/pincode/', '');
  const filePath = path.resolve(__dirname, '..', 'public', 'data', 'pincode', rel);
  if (!fs.existsSync(filePath)) {
    return { ok: false, status: 404 };
  }
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  return {
    ok: true,
    status: 200,
    json: async () => data
  };
}

test('cleanPostOfficeName strips suffixes correctly', () => {
  assert.equal(cleanPostOfficeName('Raebareli H.O'), 'Raebareli');
  assert.equal(cleanPostOfficeName('Bachhrawan S.O'), 'Bachhrawan');
  assert.equal(cleanPostOfficeName('Amwan B.O'), 'Amwan');
  assert.equal(cleanPostOfficeName('Civil Lines Sub Post Office S.O'), 'Civil Lines');
});

test('lookupPincode identifies single district UP PIN code 229001 (Raebareli)', async () => {
  const res = await lookupPincode('229001', mockFetch);
  assert.equal(res.valid, true);
  assert.equal(res.isMultiDistrict, false);
  assert.equal(res.districtSlug, 'raebareli');
  assert.ok(res.localities.includes('Raebareli'));
  assert.ok(res.hasTownOffice);
  assert.ok(res.message_en.includes('PIN 229001 is in raebareli district'));
});

test('lookupPincode handles multi-district border PIN code', async () => {
  const res = await lookupPincode('201001', mockFetch);
  assert.equal(res.valid, true);
  assert.equal(res.isMultiDistrict, true);
  assert.ok(res.districts.includes('ghaziabad'));
  assert.ok(res.districts.includes('gautam-buddha-nagar'));
  assert.ok(res.message_en.includes('covers more than one district'));
});

test('lookupPincode rejects non-UP PIN codes', async () => {
  const res = await lookupPincode('110001', mockFetch); // Delhi
  assert.equal(res.valid, false);
  assert.equal(res.notUp, true);
  assert.ok(res.message_en.includes('This doesn’t look like an Uttar Pradesh PIN code'));
});

test('lookupPincode handles unlisted UP PIN code gracefully', async () => {
  const res = await lookupPincode('209999', mockFetch);
  assert.equal(res.valid, false);
  assert.equal(res.notFound, true);
  assert.ok(res.message_en.includes('couldn’t find PIN 209999'));
});
