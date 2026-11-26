import { describe, it, expect, vi, afterEach } from "vitest";
import { NextRequest } from "next/server";
import {
  normalizeDevanagariDigits,
  devanagariToLatin,
  latinToDevanagari,
} from "../scripts/lib/transliterate";
import {
  krutiDevToUnicode,
  extractPdfPhones,
  parsePdfDirectoryText,
} from "../scripts/lib/pdf-directory";
import {
  humanizeSlug,
  formatPlaceLocalBody,
  formatPlaceBlockAndTehsil,
} from "../lib/place-display";
import { build1076ComplaintSummary } from "../lib/complaint-summary";
import { GET as pincodeGet } from "../app/api/pincode/route";
import { POST as feedbackPost } from "../app/api/feedback/route";
import { POST as reportPost } from "../app/api/report/route";
import bulandshahrDistrict from "../public/data/districts/bulandshahr.json";
import bulandshahrPlaces from "../public/data/places/bulandshahr.json";
import jaunpurDistrict from "../public/data/districts/jaunpur.json";
import jaunpurPlaces from "../public/data/places/jaunpur.json";
import { DistrictData, Place } from "../lib/types";

describe("Transliteration & PDF Directory Parser", () => {
  it("normalizes Devanagari digits and transliterates UP administrative terms cleanly", () => {
    expect(normalizeDevanagariDigits("०५२२-२६२३०२४")).toBe("0522-2623024");
    expect(latinToDevanagari("Municipal Corporation Lucknow")).toBe("नगर निगम लखनऊ");
    expect(latinToDevanagari("Pilibhit Municipal Board")).toBe("पीलीभीत नगर पालिका परिषद");
    expect(devanagariToLatin("लखनऊ")).toBe("lakhanau");
  });

  it("converts KrutiDev ASCII 0 abbreviations to clean Devanagari periods without touching phone numbers", () => {
    const out = krutiDevToUnicode("ch0Mh0vks0 0522-2623024 ch0ch0uxj");
    expect(out).toContain("बी.डी.ओ.");
    expect(out).toContain("0522-2623024");
    expect(out).toContain("बी.बी.नगर");
  });

  it("prioritizes UP 4-digit metro STDs over 5-digit splitting", () => {
    const phones = extractPdfPhones("NOIDA 01202395153, Lucknow 05222623024, Gorakhpur 05512336005");
    expect(phones).toContain("0120-2395153");
    expect(phones).toContain("0522-2623024");
    expect(phones).toContain("0551-2336005");
  });

  it("rejects DIOS/DIO and legacy-font mojibake lines while extracting real EO/BDO lines", () => {
    const sampleText = [
      "1. Shri Pappu Saroj डी0आई0ओ0एस0 9454457392",
      "2. ®I Aibhashek I0o0 ÖVar 8189078106",
      "3. अधिशासी अधिकारी, नगर पंचायत सिराथू 9450001234",
      "4. Block Development Officer, Machhlishahr 9454465000",
    ].join("\n");
    const rows = parsePdfDirectoryText(sampleText, "https://example.nic.in/dir.pdf", () => "");
    expect(rows.length).toBe(2);
    expect(rows.some((r) => r.phones.includes("9454457392"))).toBe(false);
    expect(rows.some((r) => r.phones.includes("8189078106"))).toBe(false);
    expect(rows.some((r) => r.phones.includes("9450001234"))).toBe(true);
    expect(rows.some((r) => r.phones.includes("9454465000"))).toBe(true);
  });
});

describe("Place Display & 1076 Summary Formatting", () => {
  const bsData = bulandshahrDistrict as unknown as DistrictData;
  const bsPlaces = bulandshahrPlaces as unknown as Place[];
  const jData = jaunpurDistrict as unknown as DistrictData;
  const jPlaces = jaunpurPlaces as unknown as Place[];

  it("strips Executive Officer prefix in formatPlaceLocalBody and renders human-readable block/tehsil", () => {
    const khurja = bsPlaces.find((p) => p.id === "lgd-ulb-249018")!;
    expect(formatPlaceLocalBody(khurja, bsData, "en")).toBe("Nagar Palika Khurja");
    expect(formatPlaceLocalBody(khurja, bsData, "hi")).not.toContain("अधिशासी अधिकारी");
    expect(formatPlaceBlockAndTehsil(khurja, bsData, "en")).toBe("Khurja (Tehsil)");
    expect(humanizeSlug("lgd-ulb-301210")).toBe("301210");
    expect(humanizeSlug("block-jaunpur-machhlishahr")).toBe("Machhlishahr");
  });

  it("builds complete bilingual 1076/Jansunwai summaries without raw slugs", () => {
    const village = jPlaces.find((p) => p.id.startsWith("lgd-") && p.type === "village")!;
    const summaryEn = build1076ComplaintSummary({
      lang: "en",
      districtData: jData,
      place: village,
      pincode: "222001",
    });
    const summaryHi = build1076ComplaintSummary({
      lang: "hi",
      districtData: jData,
      place: village,
      pincode: "222001",
    });
    expect(summaryEn).toContain("CM Helpline 1076");
    expect(summaryEn).toContain("PIN: 222001");
    expect(summaryHi).toContain("सीएम हेल्पलाइन 1076");
    expect(summaryHi).toContain("पिन: 222001");
  });
});

describe("Next.js App Router API Route Handlers", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("GET /api/pincode resolves exact UP PIN and rejects short PIN", async () => {
    const badRes = await pincodeGet(new Request("http://localhost/api/pincode?pin=22"));
    expect(badRes.status).toBe(400);

    const okRes = await pincodeGet(new Request("http://localhost/api/pincode?pin=226001"));
    expect(okRes.status).toBe(200);
    const json = await okRes.json();
    expect(json.status).toBe("up_exact");
    expect(json.matches[0].district_id).toBe("lucknow");
  });

  it("GET /api/pincode falls back cleanly to local prefix when India Post live fetch fails", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValueOnce(new Error("network offline"));
    const res = await pincodeGet(new Request("http://localhost/api/pincode?pin=226099"));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.status).toBe("up_prefix");
    expect(json.matches.map((m: any) => m.district_id)).toContain("lucknow");
  });

  it("POST /api/feedback validates payload and enforces rate limit", async () => {
    const badReq = new NextRequest("http://localhost/api/feedback", {
      method: "POST",
      headers: { "x-forwarded-for": "198.51.100.201", "content-type": "application/json" },
      body: JSON.stringify({ office_id: "bad id!", worked: true }),
    });
    expect((await feedbackPost(badReq)).status).toBe(400);

    for (let i = 0; i < 10; i++) {
      const req = new NextRequest("http://localhost/api/feedback", {
        method: "POST",
        headers: { "x-forwarded-for": "198.51.100.202", "content-type": "application/json" },
        body: JSON.stringify({ office_id: "up-jaunpur-dm", worked: true }),
      });
      expect((await feedbackPost(req)).status).toBe(204);
    }
    const overReq = new NextRequest("http://localhost/api/feedback", {
      method: "POST",
      headers: { "x-forwarded-for": "198.51.100.202", "content-type": "application/json" },
      body: JSON.stringify({ office_id: "up-jaunpur-dm", worked: false }),
    });
    expect((await feedbackPost(overReq)).status).toBe(429);
  });

  it("POST /api/report validates payload and enforces rate limit", async () => {
    const okReq = new NextRequest("http://localhost/api/report", {
      method: "POST",
      headers: { "x-forwarded-for": "198.51.100.203", "content-type": "application/json" },
      body: JSON.stringify({ office_id: "up-jaunpur-dm", reason: "not_working" }),
    });
    expect((await reportPost(okReq)).status).toBe(204);

    for (let i = 0; i < 4; i++) {
      const req = new NextRequest("http://localhost/api/report", {
        method: "POST",
        headers: { "x-forwarded-for": "198.51.100.203", "content-type": "application/json" },
        body: JSON.stringify({ office_id: "up-jaunpur-dm", reason: "wrong_person" }),
      });
      expect((await reportPost(req)).status).toBe(204);
    }
    const overReq = new NextRequest("http://localhost/api/report", {
      method: "POST",
      headers: { "x-forwarded-for": "198.51.100.203", "content-type": "application/json" },
      body: JSON.stringify({ office_id: "up-jaunpur-dm", reason: "moved" }),
    });
    expect((await reportPost(overReq)).status).toBe(429);
  });
});
