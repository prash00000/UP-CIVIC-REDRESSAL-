const https = require('https');
const fs = require('fs');
const path = require('path');
const { UP_DISTRICTS } = require('./harvest_up_authorities');

function fetch(url) {
  return new Promise((resolve) => {
    const req = https.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36' },
      timeout: 5000
    }, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        let redirectUrl = res.headers.location;
        if (!redirectUrl.startsWith('http')) {
          redirectUrl = new URL(url).origin + redirectUrl;
        }
        return fetch(redirectUrl).then(resolve);
      }
      if (res.statusCode === 200) {
        let d = '';
        res.on('data', chunk => d += chunk);
        res.on('end', () => resolve({ ok: true, status: res.statusCode, length: d.length, data: d }));
      } else {
        resolve({ ok: false, status: res.statusCode });
      }
    });
    req.on('error', () => resolve({ ok: false, error: 'network_error' }));
    req.on('timeout', () => { req.destroy(); resolve({ ok: false, error: 'timeout' }); });
  });
}

async function testDistricts() {
  console.log(`Testing first 25 districts across common directory paths...`);
  const paths = [
    'directory/',
    'whos-who/',
    'about-district/whos-who/',
    'contact-directory/'
  ];

  for (const dist of UP_DISTRICTS.slice(0, 25)) {
    let best = null;
    for (const p of paths) {
      const url = `https://${dist.slug}.nic.in/${p}`;
      const res = await fetch(url);
      if (res.ok && res.length > 10000) {
        const tableCount = (res.data.match(/<table/gi) || []).length;
        const rowCount = (res.data.match(/<tr/gi) || []).length;
        const emailCount = (res.data.match(/@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}|\[at\]/gi) || []).length;
        if (rowCount > 2) {
          best = { url, tableCount, rowCount, emailCount };
          break;
        }
      }
    }
    if (best) {
      console.log(`✓ [${dist.name}] Found: ${best.url} (Rows: ${best.rowCount}, Emails: ${best.emailCount})`);
    } else {
      console.log(`✗ [${dist.name}] No standard directory table found`);
    }
  }
}

testDistricts().catch(console.error);
