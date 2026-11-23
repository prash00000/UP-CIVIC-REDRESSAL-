import assert from 'node:assert';
import { test, describe } from 'node:test';
import { buildLetter, formatDate } from '../src/lib/letter.js';
import { validateStep1, validateStep2, validateStep3, MOBILE_REGEX } from '../src/lib/validate.js';
import { generateIcsContent } from '../src/lib/ics.js';
import { resolveOfficer, determineStatus, isStale } from '../src/lib/officers.js';

describe('Letter Builder Tests', () => {
  test('builds standard English letter with all fields', () => {
    const letter = buildLetter({
      lang: 'en',
      officer: {
        designation: 'Block Development Officer (BDO)',
        ccList: ['Chief Development Officer (CDO)', 'District Magistrate (DM)']
      },
      applicant: { name: 'Rajesh Kumar', mobile: '9876543210' },
      location: { village: 'Rampur', block: 'Shahganj', district: 'Jaunpur' },
      category: 'water',
      details: 'Handpump broken for 3 weeks.',
      prior: 'Told gram pradhan 10 days ago',
      date: '23 November 2026'
    });

    assert.ok(letter.includes('To,\nThe Block Development Officer (BDO),'));
    assert.ok(letter.includes('Subject: Complaint about Drinking water in Rampur, Shahganj'));
    assert.ok(letter.includes('I, Rajesh Kumar (mobile: 9876543210)'));
    assert.ok(letter.includes('Prior communication: Told gram pradhan 10 days ago'));
    assert.ok(letter.includes('Date: 23 November 2026'));
    assert.ok(letter.includes('Copy to: Chief Development Officer (CDO), District Magistrate (DM)'));
  });

  test('builds standard Hindi letter with typographic danda and formal register', () => {
    const letter = buildLetter({
      lang: 'hi',
      officer: {
        designation_hi: 'खंड विकास अधिकारी (BDO)',
        ccList_hi: ['मुख्य विकास अधिकारी (CDO)', 'जिलाधिकारी (DM)']
      },
      applicant: { name: 'रमेश वर्मा', mobile: '9876543210' },
      location: { village: 'अमवां', block: 'बछरावां', district: 'रायबरेली' },
      category: 'road',
      details: 'सड़क अत्यधिक क्षतिग्रस्त है।',
      prior: '',
      date: '23 नवंबर 2026'
    });

    assert.ok(letter.includes('सेवा में,\nश्रीमान खंड विकास अधिकारी (BDO),'));
    assert.ok(letter.includes('विषय: अमवां, बछरावां में सड़क और खड़ंजा के संबंध में प्रार्थना पत्र।'));
    assert.ok(letter.includes('मैं रमेश वर्मा (मोबाइल: 9876543210)'));
    assert.ok(letter.includes('अतः आपसे अनुरोध है कि स्थल का निरीक्षण कराकर'));
    assert.ok(letter.includes('प्रतिलिपि: मुख्य विकास अधिकारी (CDO), जिलाधिकारी (DM)'));
    assert.ok(!letter.includes('undefined'));
  });

  test('handles missing optional fields cleanly', () => {
    const letter = buildLetter({
      lang: 'en',
      category: 'drainage',
      details: 'Drain blocked.'
    });
    assert.ok(letter.includes('I, [Your Name] (mobile: [Mobile Number])'));
    assert.ok(!letter.includes('Prior communication:'));
    assert.ok(letter.includes('Drain blocked.'));
  });

  test('formats date properly in both languages', () => {
    const d = new Date('2026-11-23T12:00:00Z');
    assert.strictEqual(formatDate(d, 'en'), '23 November 2026');
    assert.strictEqual(formatDate(d, 'hi'), '23 नवंबर 2026');
  });
});

describe('Validation Tests', () => {
  test('validates 10-digit Indian mobile numbers properly', () => {
    assert.strictEqual(MOBILE_REGEX.test('9876543210'), true);
    assert.strictEqual(MOBILE_REGEX.test('8123456789'), true);
    assert.strictEqual(MOBILE_REGEX.test('7000000000'), true);
    assert.strictEqual(MOBILE_REGEX.test('6999999999'), true);
    assert.strictEqual(MOBILE_REGEX.test('5123456789'), false); // starts with 5
    assert.strictEqual(MOBILE_REGEX.test('987654321'), false); // 9 digits
    assert.strictEqual(MOBILE_REGEX.test('98765432100'), false); // 11 digits
    assert.strictEqual(MOBILE_REGEX.test('98765abcde'), false); // alpha
  });

  test('step 1 validation rejects empty category', () => {
    assert.strictEqual(validateStep1({ category: '' }).valid, false);
    assert.strictEqual(validateStep1({ category: 'road' }).valid, true);
  });

  test('step 2 validation checks district, block, and village', () => {
    assert.strictEqual(validateStep2({ district: '', block: '', village: '' }).valid, false);
    assert.strictEqual(validateStep2({ district: 'Agra', block: 'Achhnera', village: 'Rampur' }).valid, true);
    // Also test state-style object properties (districtSlug, blockName)
    assert.strictEqual(validateStep2({ districtSlug: 'jaunpur', blockName: 'Shahganj', village: 'Kheta Sarai' }).valid, true);
  });

  test('step 3 validation checks name, mobile, and details length caps', () => {
    const invalid = validateStep3({ name: '', mobile: '123', details: '' });
    assert.strictEqual(invalid.valid, false);
    assert.ok(invalid.errors.name);
    assert.ok(invalid.errors.mobile);
    assert.ok(invalid.errors.details);

    const valid = validateStep3({
      name: 'Amit Sharma',
      mobile: '9454465263',
      details: 'Handpump cylinder broken.'
    });
    assert.strictEqual(valid.valid, true);

    // Also test state-style object properties (applicantName, applicantMobile)
    const validState = validateStep3({
      applicantName: 'Amit Sharma',
      applicantMobile: '9454465263',
      details: 'Handpump cylinder broken.'
    });
    assert.strictEqual(validState.valid, true);
  });
});

describe('ICS Calendar Reminders Tests', () => {
  test('generates valid RFC 5545 calendar with Day 7, 15, and 30 events', () => {
    const ics = generateIcsContent({
      startDate: new Date('2026-11-23T10:00:00Z'),
      problem: 'Drinking water',
      district: 'Jaunpur',
      block: 'Shahganj',
      officer: 'BDO Shahganj'
    });

    assert.ok(ics.startsWith('BEGIN:VCALENDAR'));
    assert.ok(ics.includes('PRODID:-//UP Civic Grievance Helper//EN'));
    assert.ok(ics.includes('SUMMARY:[Day 7 Follow-Up] Call BDO Shahganj regarding Drinking water'));
    assert.ok(ics.includes('SUMMARY:[Day 15 Escalation] Sampoorna Samadhan Diwas Presentation for Drinking water'));
    assert.ok(ics.includes('SUMMARY:[Day 30 Statutory Deadline] File Jansunwai Reminder & RTI for Drinking water'));
    assert.ok(ics.includes('TRIGGER:-PT15M'));
    assert.ok(ics.endsWith('END:VCALENDAR'));
  });
});

describe('Officer Resolution & Status Tests', () => {
  test('correctly identifies stale records older than 6 months', () => {
    assert.strictEqual(isStale('2024-05-10'), true);
    assert.strictEqual(isStale('2026-11-20'), false);
  });

  test('resolves status states: verified, stale, conflicting, not_verified', () => {
    assert.strictEqual(determineStatus({ status: 'verified', checked: '2026-11-20', phone: '9454465000' }), 'verified');
    assert.strictEqual(determineStatus({ status: 'single_source', checked: '2024-05-10', phone: '9454465000' }), 'check_before_use');
    assert.strictEqual(determineStatus({ status: 'conflicting', checked: '2026-11-20', phone: '9454465001 / 9454465002' }), 'conflicting');
    assert.strictEqual(determineStatus({ status: 'not_verified', phone: '' }), 'not_verified');
    assert.strictEqual(determineStatus(null), 'not_verified');
  });

  test('routes village area to BDO with CDO, DPRO, DM in CC', () => {
    const officer = resolveOfficer({
      areaType: 'village',
      districtSlug: 'jaunpur',
      districtName: 'Jaunpur',
      blockSlug: 'shahganj',
      blockName: 'Shahganj'
    });
    assert.strictEqual(officer.designationKey, 'bdo');
    assert.ok(officer.ccList.includes('District Magistrate (DM)'));
    assert.ok(officer.ccList.includes('Chief Development Officer (CDO)'));
    assert.ok(officer.ccList.includes('District Panchayat Raj Officer (DPRO)'));
  });

  test('routes town area to Executive Officer with DM in CC', () => {
    const officer = resolveOfficer({
      areaType: 'town',
      districtSlug: 'agra',
      districtName: 'Agra',
      blockSlug: 'achhnera',
      blockName: 'Achhnera'
    });
    assert.strictEqual(officer.designationKey, 'eo');
    assert.deepStrictEqual(officer.ccList, ['District Magistrate (DM)']);
  });

  test('routes city area to Municipal Commissioner with DM and Divisional Commissioner in CC', () => {
    const officer = resolveOfficer({
      areaType: 'city',
      districtSlug: 'lucknow',
      districtName: 'Lucknow'
    });
    assert.strictEqual(officer.designationKey, 'commissioner');
    assert.deepStrictEqual(officer.ccList, ['District Magistrate (DM)', 'Divisional Commissioner']);
  });

  test('routes PWD road to Executive Engineer with CDO and DM in CC', () => {
    const officer = resolveOfficer({
      areaType: 'village',
      category: 'road',
      isPwdRoad: true,
      districtSlug: 'jaunpur',
      districtName: 'Jaunpur'
    });
    assert.strictEqual(officer.designationKey, 'ee-pwd');
    assert.deepStrictEqual(officer.ccList, ['Chief Development Officer (CDO)', 'District Magistrate (DM)']);
  });
});
