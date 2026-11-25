import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { PincodeMap } from "@/lib/types";
import { normalizeUpDistrictSlug, resolvePincode, PincodeMatch } from "@/lib/pincode";

let cachedPincodes: PincodeMap | null = null;

function getLocalPincodes(): PincodeMap {
  if (cachedPincodes) return cachedPincodes;
  try {
    const filePath = path.join(process.cwd(), "public", "data", "pincodes.json");
    cachedPincodes = JSON.parse(fs.readFileSync(filePath, "utf-8")) as PincodeMap;
    return cachedPincodes;
  } catch {
    return {};
  }
}

interface IndiaPostOffice {
  Name: string;
  BranchType?: string;
  DeliveryStatus?: string;
  District?: string;
  Division?: string;
  Block?: string;
  State?: string;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawPin = searchParams.get("pin") || "";
  const clean = rawPin.replace(/\D/g, "").slice(0, 6);

  if (clean.length !== 6) {
    return NextResponse.json({ error: "Please provide a valid 6-digit PIN code." }, { status: 400 });
  }

  const localMap = getLocalPincodes();
  const localResult = resolvePincode(clean, localMap);

  if (localResult.kind === "exact") {
    return NextResponse.json(
      {
        pin: clean,
        status: "up_exact",
        source: "india_post_index",
        matches: localResult.matches,
        localitySummary: localResult.matches
          .map((m) => m.locality_en)
          .filter(Boolean)
          .join(" | "),
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
        },
      }
    );
  }

  // Live India Post verification fallback for unlisted / newly allocated / out-of-state PINs
  try {
    const res = await fetch(`https://api.postalpincode.in/pincode/${clean}`, {
      signal: AbortSignal.timeout(4500),
      headers: { Accept: "application/json" },
    });

    if (res.ok) {
      const payload = (await res.json()) as {
        Status?: string;
        PostOffice?: IndiaPostOffice[] | null;
      }[];
      const first = payload?.[0];
      const offices = Array.isArray(first?.PostOffice) ? first.PostOffice : [];

      if (first?.Status === "Success" && offices.length > 0) {
        const upOffices = offices.filter(
          (po) => (po.State || "").trim().toLowerCase() === "uttar pradesh"
        );

        if (upOffices.length > 0) {
          const matchMap = new Map<string, PincodeMatch>();
          for (const po of upOffices) {
            const dId = normalizeUpDistrictSlug(po.District || "");
            if (!dId) continue;
            const block = po.Block && po.Block !== "NA" ? po.Block.trim() : undefined;
            const tehsil_id = block
              ? block.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")
              : undefined;
            if (!matchMap.has(dId)) {
              matchMap.set(dId, {
                district_id: dId,
                ...(tehsil_id ? { tehsil_id } : {}),
                locality_en: [
                  upOffices
                    .filter((o) => normalizeUpDistrictSlug(o.District || "") === dId)
                    .slice(0, 3)
                    .map((o) => o.Name)
                    .join(", "),
                  block ? `Block: ${block}` : "",
                ]
                  .filter(Boolean)
                  .join(" · "),
              });
            }
          }

          const matches = [...matchMap.values()];
          if (matches.length > 0) {
            return NextResponse.json(
              {
                pin: clean,
                status: "up_live",
                source: "india_post_live",
                matches,
                localitySummary: matches
                  .map((m) => m.locality_en)
                  .filter(Boolean)
                  .join(" | "),
              },
              {
                headers: {
                  "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
                },
              }
            );
          }
        } else {
          const other = offices[0];
          return NextResponse.json(
            {
              pin: clean,
              status: "out_of_state",
              source: "india_post_live",
              state: other.State || "",
              district: other.District || "",
              matches: [],
            },
            {
              headers: {
                "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
              },
            }
          );
        }
      }
    }
  } catch {
    // Fall back gracefully to local prefix result below
  }

  if (localResult.kind === "prefix") {
    return NextResponse.json({
      pin: clean,
      status: "up_prefix",
      source: "prefix_division",
      matches: localResult.matches,
    });
  }

  return NextResponse.json({
    pin: clean,
    status: localResult.kind === "invalid_prefix" ? "invalid_prefix" : "not_found",
    matches: [],
  });
}
