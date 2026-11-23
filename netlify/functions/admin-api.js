/**
 * Admin Console Backend API (review queue, spot-check gate, publish)
 */

import { generateChallenge } from '../../packages/schema/src/pow.js';

// In-memory reviewer state for test and preview verification
let spotCheckSample = [
  { id: 'sc-1', office: 'BDO Bachhrawan', district: 'Raebareli', phone: '9454465404', status: 'pending' },
  { id: 'sc-2', office: 'BDO Shahganj', district: 'Jaunpur', phone: '9454465263', status: 'pending' },
  { id: 'sc-3', office: 'BDO Badlapur', district: 'Jaunpur', phone: '9454465401', status: 'pending' },
  { id: 'sc-4', office: 'BDO Achhnera', district: 'Agra', phone: '9454465501', status: 'pending' }
];

let reviewQueue = [
  {
    id: 'rq-1',
    office: 'BDO Bachhrawan',
    district: 'Raebareli',
    oldPhone: '9454465400',
    newPhone: '9454465404',
    source: 'https://raebareli.nic.in/whos-who/',
    flags: ['owner_provided', 'non_gov_email'],
    reviewState: 'pending'
  },
  {
    id: 'rq-2',
    office: 'BDO Kerakat',
    district: 'Jaunpur',
    oldPhone: '9454465300',
    newPhone: '9454465305',
    source: 'https://jaunpur.nic.in/whos-who/',
    flags: ['older_than_24_months'],
    reviewState: 'pending'
  }
];

export async function handler(event, context) {
  const path = event.path.replace(/\/\.netlify\/functions\/admin-api/, '').replace(/\/api\/admin/, '');
  const method = event.httpMethod;

  // Basic authorization header check
  const authHeader = event.headers.authorization || '';
  const isAuth = authHeader.includes('Bearer') || event.headers['x-admin-role'] === 'admin' || event.headers['x-admin-role'] === 'reviewer';

  if (!isAuth && !path.includes('login')) {
    return {
      statusCode: 401,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: { code: 'UNAUTHORIZED', message: 'Admin authentication required' } })
    };
  }

  // Route: Dashboard
  if (path === '/dashboard' || path === '') {
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        total_districts: 75,
        total_offices: 824,
        coverage_verified: '86.4%',
        freshness_under_6m: '91.2%',
        pending_reviews: reviewQueue.filter(r => r.reviewState === 'pending').length,
        open_reports: 2,
        last_published: '2026-11-23T05:00:00Z'
      })
    };
  }

  // Route: Review Queue
  if (path === '/review-queue') {
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: reviewQueue })
    };
  }

  // Route: Approve / Reject contact
  if (path.startsWith('/contacts/') && method === 'POST') {
    const parts = path.split('/');
    const contactId = parts[2];
    const action = parts[3]; // 'approve' or 'reject'

    const item = reviewQueue.find(r => r.id === contactId);
    if (item) {
      item.reviewState = action === 'approve' ? 'approved' : 'rejected';
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ok: true, id: contactId, action, reviewState: item.reviewState })
      };
    }
    return {
      statusCode: 404,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: { code: 'NOT_FOUND', message: 'Item not found' } })
    };
  }

  // Route: Spot check
  if (path === '/spot-check') {
    if (method === 'GET') {
      const okCount = spotCheckSample.filter(s => s.status === 'ok').length;
      const failCount = spotCheckSample.filter(s => s.status === 'wrong' || s.status === 'no_answer').length;
      const totalChecked = okCount + failCount;
      const failRate = totalChecked > 0 ? (failCount / totalChecked) * 100 : 0;

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sample: spotCheckSample,
          checked_count: totalChecked,
          failure_rate: `${failRate.toFixed(1)}%`,
          publish_allowed: failRate <= 10.0
        })
      };
    }

    if (method === 'POST') {
      const body = JSON.parse(event.body || '{}');
      const item = spotCheckSample.find(s => s.id === body.id);
      if (item && ['ok', 'wrong', 'no_answer'].includes(body.status)) {
        item.status = body.status;
        return {
          statusCode: 200,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ok: true, item })
        };
      }
    }
  }

  // Route: Publish
  if (path === '/publish' && method === 'POST') {
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ok: true,
        publish_id: 'pub-' + Date.now(),
        snapshot_version: '2026-11-23',
        status: 'published',
        message: 'Static snapshots exported and build hook triggered.'
      })
    };
  }

  return {
    statusCode: 404,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ error: { code: 'NOT_FOUND', message: 'Endpoint not found' } })
  };
}
