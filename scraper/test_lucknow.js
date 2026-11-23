const https = require('https');

function fetch(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, html: data }));
    }).on('error', reject);
  });
}

async function inspectLucknowPages() {
  const pages = [
    'https://lucknow.nic.in/tehsil%e2%80%8c-name/',
    'https://lucknow.nic.in/block-name/',
    'https://lucknow.nic.in/public-utility-category/municipality/'
  ];
  for (const p of pages) {
    const res = await fetch(p);
    console.log(`\n=== URL: ${p} (Status: ${res.status}) ===`);
    const tables = res.html.match(/<table[\s\S]*?<\/table>/gi) || [];
    console.log(`Tables found: ${tables.length}`);
    if (tables.length > 0) {
      console.log('Sample rows:\n', tables[0].substring(0, 800).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' '));
    }
  }
}

inspectLucknowPages().catch(console.error);
