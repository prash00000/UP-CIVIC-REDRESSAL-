import crypto from 'crypto';

/**
 * Proof of Work (PoW) verification and challenge engine
 * Provides light client challenge (~0.3s on mobile) to deter automated spam
 */

export const POW_DIFFICULTY = 3; // 3 leading hex zeros = 1 in 4096 hashes (~0.05 - 0.2s)
export const POW_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes

export function generateChallenge(secretKey = 'default_pow_secret') {
  const timestamp = Date.now();
  const randomBytes = crypto.randomBytes(8).toString('hex');
  const payload = `${timestamp}:${randomBytes}`;
  const hmac = crypto.createHmac('sha256', secretKey).update(payload).digest('hex').slice(0, 16);
  const nonce = `${payload}:${hmac}`;

  return {
    nonce,
    difficulty: POW_DIFFICULTY,
    exp: timestamp + POW_EXPIRY_MS
  };
}

export function solveChallenge(nonce, difficulty = POW_DIFFICULTY) {
  const targetPrefix = '0'.repeat(difficulty);
  let answer = 0;
  while (true) {
    const hash = crypto.createHash('sha256').update(`${nonce}:${answer}`).digest('hex');
    if (hash.startsWith(targetPrefix)) {
      return answer;
    }
    answer++;
    if (answer > 10000000) break; // safety guard
  }
  return -1;
}

export function verifyChallenge(nonce, answer, difficulty = POW_DIFFICULTY, secretKey = 'default_pow_secret') {
  if (!nonce || typeof answer !== 'number') return false;

  const parts = nonce.split(':');
  if (parts.length !== 3) return false;

  const [tsStr, randomBytes, hmac] = parts;
  const timestamp = parseInt(tsStr, 10);
  if (isNaN(timestamp)) return false;

  // Check expiration
  if (Date.now() - timestamp > POW_EXPIRY_MS) return false;

  // Verify HMAC signature
  const expectedHmac = crypto.createHmac('sha256', secretKey).update(`${timestamp}:${randomBytes}`).digest('hex').slice(0, 16);
  if (hmac !== expectedHmac) return false;

  // Verify hash difficulty
  const targetPrefix = '0'.repeat(difficulty);
  const hash = crypto.createHash('sha256').update(`${nonce}:${answer}`).digest('hex');
  return hash.startsWith(targetPrefix);
}

export function computeDailySaltedHash(ip, userAgent, secret = 'salt_secret') {
  const dayStr = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const dailySalt = crypto.createHmac('sha256', secret).update(dayStr).digest('hex');
  return crypto.createHash('sha256').update(`${ip || '127.0.0.1'}|${userAgent || ''}|${dailySalt}`).digest('hex');
}
