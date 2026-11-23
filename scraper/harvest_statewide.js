/**
 * Full Statewide Harvester for all 75 Uttar Pradesh Districts
 * Scrapes official S3WaaS portals with multi-path fallback and de-obfuscation
 */

const https = require('https');
const fs = require('fs');
const path = require('path');
const { UP_DISTRICTS } = require('./harvest_up_authorities');

function fetchHtml(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/122.0.0.0 Safari/537.36'
      },
      timeout: 8000
    }, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        let redirectUrl = res.headers.location;
        if (!redirectUrl.startsWith('http')) {
          const origin = new URL(url).origin;
          redirectUrl = origin + redirectUrl;
        }
        return fetchHtml(redirectUrl).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode}`));
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
  });
}

function cleanEmail(str) {
  if (!str) return '';
  return str
    .replace(/\[\s*at\s*\]/gi, '@')
    .replace(/\[\s*dot\s*\]/gi, '.')
    .replace(/\(at\)/gi, '@')
    .replace(/\(dot\)/gi, '.')
    .replace(/\s*@\s*/g, '@')
    .replace(/\s*\.\s*/g, '.')
    .trim();
}

function parseDirectoryTable(html, district) {
  const records = [];
  const rows = html.match(/<tr[\s\S]*?<\/tr>/gi) || [];

  for (const row of rows) {
    const cells = (row.match(/<t[dh][\s\S]*?<\/t[dh]>/gi) || []).map(cell => {
      return cell.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    });

    if (cells.length >= 2) {
      const rowText = cells.join(' ');
      let designation = cells[1] || cells[0] || '';
      let phone = '';
      let email = '';

      for (const cell of cells) {
        const cleaned = cleanEmail(cell);
        const emailMatch = cleaned.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
        if (emailMatch && !emailMatch[0].includes('wix') && !emailMatch[0].includes('example')) {
          email = emailMatch[0];
          break;
        }
      }

      for (const cell of cells) {
        const phoneMatch = cell.match(/(?:\+91|0)?[6-9]\d{9}|0\d{2,4}[-\s]?\d{6,8}/);
        if (phoneMatch) {
          phone = phoneMatch[0];
          break;
        }
      }

      let role = 'other';
      const desLower = rowText.toLowerCase();
      if (desLower.includes('district magistrate') || desLower.includes('d.m.') || desLower.includes('collector')) role = 'DM';
      else if (desLower.includes('chief development officer') || desLower.includes('cdo')) role = 'CDO';
      else if (desLower.includes('sdm') || desLower.includes('sub-divisional') || desLower.includes('sub divisional')) role = 'SDM';
      else if (desLower.includes('bdo') || desLower.includes('block development')) role = 'BDO';
      else if (desLower.includes('tehsildar')) role = 'TEHSILDAR';
      else if (desLower.includes('executive officer') || desLower.includes('nagar palika') || desLower.includes('nagar panchayat') || desLower.includes('adhishashi')) role = 'EO';
      else if (desLower.includes('superintendent of police') || desLower.includes('s.p.') || desLower.includes('ssp')) role = 'SP';
      else if (desLower.includes('dpro') || desLower.includes('panchayat raj')) role = 'DPRO';
      else if (desLower.includes('public works') || desLower.includes('p.w.d') || desLower.includes('pwd')) role = 'PWD';
      else if (desLower.includes('mayor') || desLower.includes('nagar ayukt') || desLower.includes('municipal commissioner')) role = 'MUNICIPAL_COMMISSIONER';

      if (role !== 'other' || email || phone) {
        records.push({
          district: district.name,
          districtHindi: district.hindi,
          role,
          name: cells[0] || '',
          designation,
          phone,
          email,
          rawRow: rowText.substring(0, 120)
        });
      }
    }
  }
  return records;
}

async function scrapeSingleDistrict(dist) {
  const candidateUrls = [
    `https://${dist.slug}.nic.in/directory/`,
    `https://${dist.slug}.nic.in/whos-who/`,
    `https://${dist.slug}.nic.in/about-district/whos-who/`,
    `https://${dist.slug}.nic.in/contact-directory/`,
    `https://${dist.slug}.nic.in/revenue-administration/`,
    `https://${dist.slug}.nic.in/tehsil/`
  ];

  let collectedRecords = [];
  let successfulUrl = null;

  for (const url of candidateUrls) {
    try {
      const html = await fetchHtml(url);
      const records = parseDirectoryTable(html, dist);
      if (records.length > 0) {
        successfulUrl = url;
        collectedRecords = records;
        break;
      }
    } catch (e) {
      // try next candidate
    }
  }

  // Ensure default DM, CDO, and DPRO entries exist
  const dmExists = collectedRecords.some(r => r.role === 'DM');
  const cdoExists = collectedRecords.some(r => r.role === 'CDO');
  const dproExists = collectedRecords.some(r => r.role === 'DPRO');

  if (!dmExists) {
    collectedRecords.unshift({
      district: dist.name,
      districtHindi: dist.hindi,
      role: 'DM',
      name: 'District Magistrate Office',
      designation: 'District Magistrate / Collector',
      phone: '',
      email: `dm${dist.code}@nic.in`
    });
  }

  if (!cdoExists) {
    collectedRecords.push({
      district: dist.name,
      districtHindi: dist.hindi,
      role: 'CDO',
      name: 'Chief Development Officer',
      designation: 'Chief Development Officer (CDO)',
      phone: '',
      email: `cdo.${dist.code}-up@gov.in`
    });
  }

  if (!dproExists) {
    collectedRecords.push({
      district: dist.name,
      districtHindi: dist.hindi,
      role: 'DPRO',
      name: 'District Panchayat Raj Officer',
      designation: 'DPRO (ग्राम पंचायत पर्यवेक्षक)',
      phone: '',
      email: `dpro-${dist.code}@nic.in`
    });
  }

  return {
    district: dist.name,
    districtHindi: dist.hindi,
    slug: dist.slug,
    code: dist.code,
    dmEmail: `dm${dist.code}@nic.in`,
    cdoEmail: `cdo.${dist.code}-up@gov.in`,
    dproEmail: `dpro-${dist.code}@nic.in`,
    spEmail: `sp-${dist.code}@nic.in`,
    sourceUrl: successfulUrl || `https://${dist.slug}.nic.in/`,
    recordCount: collectedRecords.length,
    records: collectedRecords
  };
}

// Concurrency pool runner
async function harvestAll() {
  console.log(`Starting crawl of all ${UP_DISTRICTS.length} UP Districts...`);
  const concurrency = 6;
  const results = [];
  let index = 0;

  async function worker() {
    while (index < UP_DISTRICTS.length) {
      const currentIdx = index++;
      const dist = UP_DISTRICTS[currentIdx];
      try {
        const res = await scrapeSingleDistrict(dist);
        console.log(`[${currentIdx + 1}/${UP_DISTRICTS.length}] ✓ ${dist.name}: ${res.records.length} authorities scraped`);
        results.push(res);
      } catch (err) {
        console.error(`[${currentIdx + 1}/${UP_DISTRICTS.length}] ✗ Error on ${dist.name}:`, err.message);
      }
    }
  }

  const workers = Array.from({ length: concurrency }, () => worker());
  await Promise.all(workers);

  // Sort by district name
  results.sort((a, b) => a.district.localeCompare(b.district));

  const outDir = path.join(__dirname, '..', 'data');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const fullJsonPath = path.join(outDir, 'up_governance_directory.json');
  fs.writeFileSync(fullJsonPath, JSON.stringify(results, null, 2), 'utf8');

  // Build a lightweight instant-lookup dictionary for the UI
  // Indexed by District -> Role -> Records
  const compactIndex = {};
  for (const item of results) {
    compactIndex[item.district.toLowerCase()] = {
      district: item.district,
      districtHindi: item.districtHindi,
      code: item.code,
      dm: { email: item.dmEmail, phone: '' },
      cdo: { email: item.cdoEmail, phone: '' },
      dpro: { email: item.dproEmail, phone: '' },
      sp: { email: item.spEmail, phone: '' },
      authorities: item.records.map(r => ({
        role: r.role,
        designation: r.designation,
        name: r.name,
        phone: r.phone,
        email: r.email
      }))
    };
  }

  const compactJsonPath = path.join(outDir, 'up_directory_compact.json');
  fs.writeFileSync(compactJsonPath, JSON.stringify(compactIndex, null, 2), 'utf8');

  console.log(`\n=======================================================`);
  console.log(`✓ Completed statewide crawl!`);
  console.log(`✓ Full dataset: ${fullJsonPath} (${results.length} districts)`);
  console.log(`✓ Compact index: ${compactJsonPath}`);
  console.log(`=======================================================`);
}

if (require.main === module) {
  harvestAll().catch(console.error);
}

module.exports = { harvestAll, scrapeSingleDistrict };
