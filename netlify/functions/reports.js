/**
 * Anonymous Error Reporting Endpoint
 * POST /api/v1/reports
 */

import { validateReportPayload } from '../../packages/schema/src/index.js';
import { verifyChallenge, computeDailySaltedHash } from '../../packages/schema/src/pow.js';

// In-memory rate limiting & report store for serverless resilience
const recentReports = []; // { officeId, hash, timestamp }

export async function handler(event, context) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' } })
    };
  }

  let body = {};
  try {
    body = JSON.parse(event.body || '{}');
  } catch (err) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: { code: 'BAD_REQUEST', message: 'Invalid JSON payload' } })
    };
  }

  // Honeypot check: bot prevention
  if (body.website || body.address_honeypot) {
    return { statusCode: 204 }; // Silent drop for bots
  }

  // Validate payload
  const validation = validateReportPayload(body);
  if (!validation.valid) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: { code: 'VALIDATION_FAILED', message: 'Invalid fields' } })
    };
  }

  // Verify Proof-of-Work Challenge
  const secretKey = process.env.REPORT_SALT_SECRET || 'salt_secret_key_123';
  const isChallengeValid = verifyChallenge(body.challenge.nonce, body.challenge.answer, undefined, secretKey);
  if (!isChallengeValid) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: { code: 'INVALID_CHALLENGE', message: 'Proof of work verification failed' } })
    };
  }

  // Compute daily-salted reporter hash (never store or log IP)
  const clientIp = event.headers['x-forwarded-for'] || event.headers['client-ip'] || '127.0.0.1';
  const userAgent = event.headers['user-agent'] || '';
  const reporterHash = computeDailySaltedHash(clientIp, userAgent, secretKey);

  const now = Date.now();
  const oneDayAgo = now - 24 * 60 * 60 * 1000;
  const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;

  // Rate limit checks:
  // 1. Max 5 reports per hash per day
  const reportsToday = recentReports.filter(r => r.hash === reporterHash && r.timestamp > oneDayAgo);
  if (reportsToday.length >= 5) {
    return {
      statusCode: 429,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: { code: 'RATE_LIMITED', message: 'Daily report submission limit reached' } })
    };
  }

  // 2. Max 1 report per office per hash per 7 days
  const officeReport = recentReports.find(r => r.hash === reporterHash && r.officeId === body.officeId && r.timestamp > sevenDaysAgo);
  if (officeReport) {
    return {
      statusCode: 429,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: { code: 'RATE_LIMITED', message: 'A report was already submitted for this office recently' } })
    };
  }

  // Record valid report
  recentReports.push({
    officeId: body.officeId,
    hash: reporterHash,
    kind: body.kind,
    note: body.note || null,
    timestamp: now
  });

  // Success: 204 No Content (Never echo user inputs)
  return {
    statusCode: 204,
    headers: {
      'Cache-Control': 'no-store, max-age=0'
    }
  };
}
