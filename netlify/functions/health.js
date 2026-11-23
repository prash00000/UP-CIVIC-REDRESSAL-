/**
 * Health check endpoint for uptime monitoring
 * GET /api/v1/health
 */

export async function handler(event, context) {
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' } })
    };
  }

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store, max-age=0'
    },
    body: JSON.stringify({
      ok: true,
      service: 'UP Civic Grievance Helper API',
      version: '1.0.0',
      timestamp: new Date().toISOString()
    })
  };
}
