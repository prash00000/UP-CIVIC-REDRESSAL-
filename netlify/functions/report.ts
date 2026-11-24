import type { Handler, HandlerEvent } from "@netlify/functions";
import crypto from "crypto";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";

const reportSchema = z.object({
  office_id: z.string().optional(),
  reason: z.enum(["not_working", "wrong_person", "moved", "other"]),
  details: z.string().max(500).optional(),
  contact: z.string().max(100).optional(),
});

// In-memory rate limiting cache
const memoryRateLimitCache = new Map<string, number[]>();

function checkRateLimit(ipHash: string, maxPerHour: number): boolean {
  const now = Date.now();
  const windowMs = 60 * 60 * 1000;
  const timestamps = (memoryRateLimitCache.get(ipHash) || []).filter(
    (t) => now - t < windowMs
  );
  if (timestamps.length >= maxPerHour) {
    return false;
  }
  timestamps.push(now);
  memoryRateLimitCache.set(ipHash, timestamps);
  return true;
}

export const handler: Handler = async (event: HandlerEvent) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  try {
    const rawBody = event.body ? JSON.parse(event.body) : {};
    const parsed = reportSchema.safeParse(rawBody);

    if (!parsed.success) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Invalid payload", details: parsed.error.issues }),
      };
    }

    const clientIp =
      event.headers["x-nf-client-connection-ip"] ||
      event.headers["client-ip"] ||
      event.headers["x-forwarded-for"] ||
      "127.0.0.1";

    const dailySalt = process.env.DAILY_SALT || new Date().toISOString().split("T")[0];
    const ipHash = crypto
      .createHash("sha256")
      .update(clientIp + dailySalt)
      .digest("hex");

    // Rate Limit Check (5 writes per ip_hash per hour)
    if (!checkRateLimit(ipHash, 5)) {
      return {
        statusCode: 429,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Rate limit exceeded. Maximum 5 reports per hour." }),
      };
    }

    // Persist to Supabase if configured
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey);
      await supabase.from("error_reports").insert({
        office_id: parsed.data.office_id || null,
        reason: parsed.data.reason,
        details: parsed.data.details || null,
        contact: parsed.data.contact || null,
        ip_hash: ipHash,
        status: "new",
      });
    }

    return {
      statusCode: 204,
      body: "",
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Internal server error" }),
    };
  }
};
