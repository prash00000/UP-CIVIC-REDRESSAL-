import test from 'node:test';
import assert from 'node:assert/strict';
import { generateChallenge, solveChallenge, verifyChallenge, computeDailySaltedHash } from '../packages/schema/src/pow.js';

test('PoW Challenge generation and verification', () => {
  const challenge = generateChallenge();
  assert.ok(challenge.nonce);
  assert.ok(challenge.difficulty > 0);
  assert.ok(challenge.exp > Date.now());

  // Solve challenge
  const answer = solveChallenge(challenge.nonce, challenge.difficulty);
  assert.ok(answer >= 0);

  // Verify challenge
  const isValid = verifyChallenge(challenge.nonce, answer, challenge.difficulty);
  assert.strictEqual(isValid, true);

  // Rejects wrong answer
  const isInvalid = verifyChallenge(challenge.nonce, answer + 999999, challenge.difficulty);
  assert.strictEqual(isInvalid, false);

  // Rejects tampered nonce
  const tampered = verifyChallenge(challenge.nonce + 'tamper', answer, challenge.difficulty);
  assert.strictEqual(tampered, false);
});

test('computeDailySaltedHash generates stable hash for the day and protects raw IP', () => {
  const ip = '192.168.1.50';
  const ua = 'Mozilla/5.0 Android';
  const hash1 = computeDailySaltedHash(ip, ua);
  const hash2 = computeDailySaltedHash(ip, ua);

  assert.strictEqual(hash1, hash2);
  assert.ok(hash1.length === 64);
  assert.ok(!hash1.includes(ip)); // Raw IP is never present
});
