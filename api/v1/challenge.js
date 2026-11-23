/**
 * Vercel Serverless Function: Proof-of-Work Challenge Generator
 * GET /api/v1/challenge
 */

import { generateChallenge } from '../../packages/schema/src/pow.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' }
    });
  }

  const secretKey = process.env.REPORT_SALT_SECRET || 'salt_secret_key_123';
  const challenge = generateChallenge(secretKey);

  res.setHeader('Cache-Control', 'no-store, max-age=0');
  return res.status(200).json(challenge);
}
