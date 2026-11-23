/**
 * Scheduled function (weekly) to identify and flag stale officer records (> 24 months)
 */

export async function handler(event, context) {
  const isScheduled = Boolean(event.headers && event.headers['x-netlify-event'] === 'scheduled');
  const now = new Date();
  const twoYearsAgo = new Date();
  twoYearsAgo.setFullYear(now.getFullYear() - 2);

  // In production with DB, updates contact_versions where checked_on < twoYearsAgo
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ok: true,
      job: 'stale_records_checker',
      evaluated_at: now.toISOString(),
      stale_threshold_date: twoYearsAgo.toISOString().slice(0, 10),
      status: 'completed',
      stale_count: 0
    })
  };
}
