const https = require('https');

function fetch(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

async function check() {
  const html = await fetch('https://lucknow.nic.in/directory/');
  console.log('Lucknow length:', html.length);
  
  // Find sub-department/category links inside the directory page
  const linkMatches = [...html.matchAll(/href=["']([^"']+)["']/gi)].map(m => m[1]);
  const catLinks = linkMatches.filter(l => l.includes('whos-who') || l.includes('directory') || l.includes('category') || l.includes('sub-division') || l.includes('tehsil') || l.includes('block'));
  console.log('Category links on directory page:', [...new Set(catLinks)]);
  
  const tables = html.match(/<table[\s\S]*?<\/table>/gi) || [];
  console.log('Tables on main directory page:', tables.length);
  if (tables.length > 0) {
    console.log('First table preview:', tables[0].substring(0, 400));
  }
}

check().catch(console.error);
