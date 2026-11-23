/**
 * Proof-of-work challenge generator
 * GET /api/v1/challenge
 */

import { generateChallenge } from '../../packages/schema/src/pow.js';

export async function handler(event, context) {
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' } })
    };
  }

  const secretKey = process.env.REPORT_SALT_SECRET || 'salt_secret_key_123';
  const challenge = generateChallenge(secretKey);

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store, max-age=0'
    },
    body: JSON.stringify(challenge)
  };
}
