import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";

async function exportRecheck() {
  console.log("🔄 Running nightly recheck export...");
  const outputPath = path.join(process.cwd(), "public", "data", "recheck.json");

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.log("ℹ️ SUPABASE_URL not configured. Exporting empty/static recheck.json");
    fs.writeFileSync(outputPath, JSON.stringify({ recheck_offices: [] }, null, 2));
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from("number_feedback")
    .select("office_id, worked")
    .gte("created_at", thirtyDaysAgo);

  if (error) {
    console.error("Failed to query number_feedback:", error);
    process.exit(1);
  }

  const tallies: Record<string, { yes: number; no: number }> = {};
  for (const row of data || []) {
    if (!tallies[row.office_id]) {
      tallies[row.office_id] = { yes: 0, no: 0 };
    }
    if (row.worked) tallies[row.office_id].yes++;
    else tallies[row.office_id].no++;
  }

  const flaggedOffices: string[] = [];
  for (const [officeId, stats] of Object.entries(tallies)) {
    const total = stats.yes + stats.no;
    if (stats.no >= 3 && stats.no / total > 0.5) {
      flaggedOffices.push(officeId);
    }
  }

  fs.writeFileSync(
    outputPath,
    JSON.stringify({ recheck_offices: flaggedOffices, generated_at: new Date().toISOString() }, null, 2)
  );
  console.log(`✅ Saved ${flaggedOffices.length} flagged offices to ${outputPath}`);
}

exportRecheck();
