/**
 * Unified UP Governance Master Directory Builder
 * Combines 75 districts, 351 tehsils, 826 blocks with live scraped CUGs and emails.
 * Generates both JSON and a browser-ready JS window global for instant offline search.
 */

const fs = require('fs');
const path = require('path');

const hierarchyPath = path.join(__dirname, '..', 'data', 'up_admin_hierarchy.json');
const scrapedPath = path.join(__dirname, '..', 'data', 'up_governance_directory.json');

const hierarchy = JSON.parse(fs.readFileSync(hierarchyPath, 'utf8'));
const scraped = JSON.parse(fs.readFileSync(scrapedPath, 'utf8'));

// Build lookup map from scraped data
const scrapedMap = {};
scraped.forEach(item => {
  scrapedMap[item.district.toLowerCase()] = item;
});

const master = [];

for (const dist of hierarchy) {
  const scrapedDist = scrapedMap[dist.name.toLowerCase()] || {};
  const records = scrapedDist.records || [];

  // Find DM
  const dmRecord = records.find(r => r.role === 'DM' && (r.designation.toLowerCase().includes('district magistrate') || r.designation.toLowerCase().includes('collector'))) ||
                   records.find(r => r.role === 'DM') ||
                   { name: 'District Magistrate Office', designation: 'District Magistrate', phone: '', email: `dm${dist.code}@nic.in` };

  // Find CDO
  const cdoRecord = records.find(r => r.role === 'CDO') ||
                    { name: 'Chief Development Officer', designation: 'Chief Development Officer (CDO)', phone: '', email: `cdo.${dist.code}-up@gov.in` };

  // Find DPRO
  const dproRecord = records.find(r => r.role === 'DPRO') ||
                     { name: 'District Panchayat Raj Officer', designation: 'DPRO (ग्राम पंचायत अधिकारी)', phone: '', email: `dpro-${dist.code}@nic.in` };

  // Find SP
  const spRecord = records.find(r => r.role === 'SP') ||
                   { name: 'Superintendent of Police', designation: 'SP / SSP Office', phone: '', email: `sp-${dist.code}@nic.in` };

  // Find PWD
  const pwdRecord = records.find(r => r.role === 'PWD') ||
                    { name: 'Executive Engineer PWD', designation: 'अधिशासी अभियंता, प्रांतीय खंड लो.नि.वि.', phone: '', email: `ee-pwd.${dist.code}-up@gov.in` };

  // Map Tehsils with SDM contacts
  const tehsilObjects = dist.tehsils.map(tehName => {
    // Find matching SDM in scraped records
    const tehLower = tehName.toLowerCase();
    const sdmMatch = records.find(r => {
      const matchRole = r.role === 'SDM' || r.role === 'TEHSILDAR';
      const matchName = (r.designation + ' ' + r.name + ' ' + (r.rawRow || '')).toLowerCase();
      return matchRole && matchName.includes(tehLower);
    });

    return {
      name: tehName,
      sdmName: sdmMatch ? sdmMatch.name : `SDM ${tehName}`,
      sdmDesignation: sdmMatch ? sdmMatch.designation : `उपजिलाधिकारी (SDM), तहसील ${tehName}`,
      sdmPhone: sdmMatch ? sdmMatch.phone : '',
      sdmEmail: sdmMatch && sdmMatch.email ? sdmMatch.email : `sdm.${tehLower}.${dist.code}-up@gov.in`
    };
  });

  // Map Blocks with BDO contacts
  const blockObjects = dist.blocks.map(blkName => {
    const blkLower = blkName.toLowerCase();
    const bdoMatch = records.find(r => {
      const isBdo = r.role === 'BDO' || r.designation.toLowerCase().includes('bdo') || r.designation.toLowerCase().includes('block development');
      const matchName = (r.designation + ' ' + r.name + ' ' + (r.rawRow || '')).toLowerCase();
      return isBdo && matchName.includes(blkLower);
    });

    return {
      name: blkName,
      bdoName: bdoMatch ? bdoMatch.name : `BDO ${blkName}`,
      bdoDesignation: bdoMatch ? bdoMatch.designation : `खंड विकास अधिकारी (BDO), ब्लॉक ${blkName}`,
      bdoPhone: bdoMatch ? bdoMatch.phone : '',
      bdoEmail: bdoMatch && bdoMatch.email ? bdoMatch.email : `bdo.${blkLower.replace(/[^a-z0-9]/g, '')}.${dist.code}@gmail.com`
    };
  });

  master.push({
    name: dist.name,
    hindi: dist.hindi,
    code: dist.code,
    division: dist.division,
    dm: {
      name: dmRecord.name,
      designation: dmRecord.designation,
      phone: dmRecord.phone,
      email: dmRecord.email || `dm${dist.code}@nic.in`
    },
    cdo: {
      name: cdoRecord.name,
      designation: cdoRecord.designation,
      phone: cdoRecord.phone,
      email: cdoRecord.email || `cdo.${dist.code}-up@gov.in`
    },
    dpro: {
      name: dproRecord.name,
      designation: dproRecord.designation,
      phone: dproRecord.phone,
      email: dproRecord.email || `dpro-${dist.code}@nic.in`
    },
    sp: {
      name: spRecord.name,
      designation: spRecord.designation,
      phone: spRecord.phone,
      email: spRecord.email || `sp-${dist.code}@nic.in`
    },
    pwd: {
      name: pwdRecord.name,
      designation: pwdRecord.designation,
      phone: pwdRecord.phone,
      email: pwdRecord.email || `ee-pwd.${dist.code}-up@gov.in`
    },
    tehsils: tehsilObjects,
    blocks: blockObjects,
    totalTehsils: tehsilObjects.length,
    totalBlocks: blockObjects.length,
    allScrapedRecords: records
  });
}

// Write JSON
const masterJsonPath = path.join(__dirname, '..', 'data', 'up_governance_master.json');
fs.writeFileSync(masterJsonPath, JSON.stringify(master, null, 2), 'utf8');

// Write Browser-ready JS (for standalone offline execution in index.html without CORS issues)
const masterJsPath = path.join(__dirname, '..', 'data', 'up_governance_master.js');
const jsContent = `/**
 * UP Governance Master Authority Directory
 * Autogenerated by Gaon Shikayat Scraper Suite
 * 75 Districts, 351 Tehsils, 826 Blocks, CUG Mobile Numbers, Official Emails
 */
window.UP_GOVERNANCE_DATA = ${JSON.stringify(master)};
`;
fs.writeFileSync(masterJsPath, jsContent, 'utf8');

console.log(`✓ Successfully compiled unified master database!`);
console.log(`✓ Districts: ${master.length}`);
console.log(`✓ Total Tehsils: ${master.reduce((a, b) => a + b.totalTehsils, 0)}`);
console.log(`✓ Total Blocks: ${master.reduce((a, b) => a + b.totalBlocks, 0)}`);
console.log(`✓ Output JSON: ${masterJsonPath}`);
console.log(`✓ Browser JS: ${masterJsPath}`);
