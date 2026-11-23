/**
 * iCalendar (.ics) generator for Day 7, Day 15, and Day 30 follow-up milestones
 */

function formatIcsDate(dateObj) {
  const y = dateObj.getUTCFullYear();
  const m = String(dateObj.getUTCMonth() + 1).padStart(2, '0');
  const d = String(dateObj.getUTCDate()).padStart(2, '0');
  const h = String(dateObj.getUTCHours()).padStart(2, '0');
  const min = String(dateObj.getUTCMinutes()).padStart(2, '0');
  const s = String(dateObj.getUTCSeconds()).padStart(2, '0');
  return `${y}${m}${d}T${h}${min}${s}Z`;
}

export function generateIcsContent({
  startDate = new Date(),
  problem = 'Civic Grievance',
  district = '',
  block = '',
  officer = 'Block Officer'
} = {}) {
  const baseDate = new Date(startDate);
  const nowStr = formatIcsDate(new Date());

  const milestones = [
    {
      days: 7,
      summary: `[Day 7 Follow-Up] Call ${officer} regarding ${problem}`,
      description: `Call the official CUG line between 10:00 AM and 12:00 PM.\\nQuote your complaint letter diary receipt number and inquire about site inspection schedule.\\nBlock: ${block}, District: ${district}`
    },
    {
      days: 15,
      summary: `[Day 15 Escalation] Sampoorna Samadhan Diwas Presentation for ${problem}`,
      description: `If no inspection has taken place, attend Tehsil Samadhan Diwas (held on designated Saturdays at your Tehsil).\\nPresent your receipt copy to the SDM or CDO.\\nBlock: ${block}, District: ${district}`
    },
    {
      days: 30,
      summary: `[Day 30 Statutory Deadline] File Jansunwai Reminder & RTI for ${problem}`,
      description: `The 30-day statutory resolution timeframe under UP Janhit Guarantee Act, 2011 has elapsed.\\n1. Submit a formal reminder on jansunwai.up.nic.in\\n2. File an RTI request on rtionline.up.gov.in for the Action Taken Report (ATR).\\nBlock: ${block}, District: ${district}`
    }
  ];

  let events = '';

  milestones.forEach((m, idx) => {
    const eventStart = new Date(baseDate.getTime() + m.days * 24 * 60 * 60 * 1000);
    eventStart.setUTCHours(4, 30, 0, 0); // 10:00 AM IST is 04:30 UTC
    const eventEnd = new Date(eventStart.getTime() + 60 * 60 * 1000); // 1 hour duration

    const startStr = formatIcsDate(eventStart);
    const endStr = formatIcsDate(eventEnd);
    const uid = `upcivic-${Date.now()}-${m.days}-${idx}@upcivic.in`;

    events += `BEGIN:VEVENT
UID:${uid}
DTSTAMP:${nowStr}
DTSTART:${startStr}
DTEND:${endStr}
SUMMARY:${m.summary}
DESCRIPTION:${m.description}
STATUS:CONFIRMED
BEGIN:VALARM
TRIGGER:-PT15M
ACTION:DISPLAY
DESCRIPTION:Reminder
END:VALARM
END:VEVENT
`;
  });

  return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//UP Civic Grievance Helper//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
${events}END:VCALENDAR`.replace(/\r?\n/g, '\r\n');
}

/**
 * Browser download helper
 */
export function downloadIcs(params) {
  const content = generateIcsContent(params);
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `grievance-reminders-30days.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
