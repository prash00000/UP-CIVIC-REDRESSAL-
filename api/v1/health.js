/**
 * Vercel Serverless Function: Health Check Endpoint
 * GET /api/v1/health
 */

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' }
    });
  }

  res.setHeader('Cache-Control', 'no-store, max-age=0');
  return res.status(200).json({
    ok: true,
    service: 'UP Civic Grievance Helper API',
    platform: 'Vercel Serverless',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
}
