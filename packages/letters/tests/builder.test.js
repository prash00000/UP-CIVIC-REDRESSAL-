import test from 'node:test';
import assert from 'node:assert/strict';
import { buildLetter, formatDate } from '../src/index.js';

test('formatDate formats dates correctly in English and Hindi', () => {
  const d = new Date(2026, 10, 23); // Nov 23, 2026
  assert.equal(formatDate(d, 'en'), '23 November 2026');
  assert.equal(formatDate(d, 'hi'), '23 नवंबर 2026');
});

test('buildLetter produces valid English letter structure', () => {
  const letter = buildLetter({
    lang: 'en',
    officer: {
      designation: 'Block Development Officer (BDO)',
      ccList: ['CDO', 'DM']
    },
    applicant: {
      name: 'Rajesh Kumar',
      mobile: '9876543210'
    },
    location: {
      village: 'Rampur',
      block: 'Shahganj',
      district: 'Jaunpur'
    },
    category: 'water',
    details: 'The handpump has been broken for 2 weeks.',
    prior: 'Informed ward member 10 days ago',
    date: new Date(2026, 10, 23)
  });

  assert.ok(letter.includes('To,\nThe Block Development Officer (BDO),\nShahganj, District Jaunpur'));
  assert.ok(letter.includes('Subject: Complaint about Drinking water in Rampur, Shahganj'));
  assert.ok(letter.includes('I, Rajesh Kumar (mobile: 9876543210), live in Rampur, Shahganj, District Jaunpur.'));
  assert.ok(letter.includes('The handpump has been broken for 2 weeks.'));
  assert.ok(letter.includes('Prior note: Informed ward member 10 days ago.'));
  assert.ok(letter.includes('Please give me a diary or receipt number'));
  assert.ok(letter.includes('Date: 23 November 2026'));
  assert.ok(letter.includes('Copy to: CDO, DM'));
});

test('buildLetter produces valid Hindi letter structure', () => {
  const letter = buildLetter({
    lang: 'hi',
    officer: {
      designation_hi: 'खंड विकास अधिकारी (BDO)',
      ccList_hi: ['सीडीओ', 'डीएम']
    },
    applicant: {
      name: 'राम कुमार',
      mobile: '9876543210'
    },
    location: {
      village: 'रामपुर',
      block: 'शाहगंज',
      district: 'जौनपुर'
    },
    category: 'road',
    details: 'सड़क पर गहरे गड्ढे हैं और जलभराव है।',
    prior: 'पहले भी मौखिक सूचना दी गई थी',
    date: new Date(2026, 10, 23)
  });

  assert.ok(letter.includes('सेवा में,\nश्रीमान खंड विकास अधिकारी (BDO),\nशाहगंज, जनपद जौनपुर'));
  assert.ok(letter.includes('विषय: रामपुर, शाहगंज में सड़क और खड़ंजा के संबंध में प्रार्थना पत्र।'));
  assert.ok(letter.includes('मैं राम कुमार (मोबाइल: 9876543210), ग्राम/मोहल्ला रामपुर, ब्लॉक शाहगंज, जनपद जौनपुर का निवासी हूँ।'));
  assert.ok(letter.includes('सड़क पर गहरे गड्ढे हैं और जलभराव है।'));
  assert.ok(letter.includes('पूर्व संदर्भ: पहले भी मौखिक सूचना दी गई थी।'));
  assert.ok(letter.includes('कृपया इस प्रार्थना पत्र की प्राप्ति संख्या (डायरी नंबर) भी प्रदान करें।'));
  assert.ok(letter.includes('दिनांक: 23 नवंबर 2026'));
  assert.ok(letter.includes('प्रतिलिपि: सीडीओ, डीएम'));
});

test('buildLetter handles missing optional prior notes gracefully', () => {
  const letter = buildLetter({
    lang: 'en',
    officer: { designation: 'Executive Officer' },
    applicant: { name: 'Sunil', mobile: '9123456789' },
    location: { village: 'Ward 2', block: 'Khair', district: 'Aligarh' },
    category: 'lights',
    details: 'Street lights not working.'
  });

  assert.ok(!letter.includes('Prior note:'));
  assert.ok(letter.includes('Complaint about Street lights in Ward 2, Khair'));
});
