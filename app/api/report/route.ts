import { NextRequest, NextResponse } from "next/server";
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

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.json();
    const parsed = reportSchema.safeParse(rawBody);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid payload", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const clientIp =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "127.0.0.1";

    const dailySalt = process.env.DAILY_SALT || new Date().toISOString().split("T")[0];
    const ipHash = crypto
      .createHash("sha256")
      .update(clientIp + dailySalt)
      .digest("hex");

    if (!checkRateLimit(ipHash, 5)) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Maximum 5 reports per hour." },
        { status: 429 }
      );
    }

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

    return new NextResponse(null, { status: 204 });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
