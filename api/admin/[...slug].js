/**
 * Vercel Serverless Function: Admin Console Backend API Catch-all
 * Matches /api/admin/*
 */

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

export default async function handler(req, res) {
  const { slug } = req.query;
  const path = Array.isArray(slug) ? '/' + slug.join('/') : (slug ? '/' + slug : '/dashboard');
  const method = req.method;

  const authHeader = req.headers.authorization || '';
  const isAuth = authHeader.includes('Bearer') || req.headers['x-admin-role'] === 'admin' || req.headers['x-admin-role'] === 'reviewer';

  if (!isAuth && !path.includes('login')) {
    return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Admin authentication required' } });
  }

  // Route: Dashboard
  if (path === '/dashboard' || path === '/') {
    return res.status(200).json({
      total_districts: 75,
      total_offices: 824,
      coverage_verified: '86.4%',
      freshness_under_6m: '91.2%',
      pending_reviews: reviewQueue.filter(r => r.reviewState === 'pending').length,
      open_reports: 2,
      last_published: '2026-11-23T05:00:00Z'
    });
  }

  // Route: Review Queue
  if (path === '/review-queue') {
    return res.status(200).json({ items: reviewQueue });
  }

  // Route: Approve / Reject contact
  if (path.startsWith('/contacts/') && method === 'POST') {
    const parts = path.split('/');
    const contactId = parts[2];
    const action = parts[3];

    const item = reviewQueue.find(r => r.id === contactId);
    if (item) {
      item.reviewState = action === 'approve' ? 'approved' : 'rejected';
      return res.status(200).json({ ok: true, id: contactId, action, reviewState: item.reviewState });
    }
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Item not found' } });
  }

  // Route: Spot-Check Gate
  if (path === '/spot-check') {
    return res.status(200).json({ sample: spotCheckSample });
  }

  // Route: Snapshot Publish
  if (path === '/publish' && method === 'POST') {
    return res.status(200).json({
      ok: true,
      message: 'Vercel static snapshot compilation complete',
      published_version: new Date().toISOString().slice(0, 10),
      published_at: new Date().toISOString()
    });
  }

  return res.status(404).json({ error: { code: 'NOT_FOUND', message: `Unknown admin route ${path}` } });
}
