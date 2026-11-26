import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { POST as feedbackPost } from "../app/api/feedback/route";
import { POST as reportPost } from "../app/api/report/route";
import { GET as pincodeGet } from "../app/api/pincode/route";

function makeNextRequest(
  url: string,
  method: "GET" | "POST",
  body?: unknown,
  ip: string = "192.0.2.10"
): NextRequest {
  return new NextRequest(url, {
    method,
    headers: {
      "x-forwarded-for": ip,
      "content-type": "application/json",
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
}

describe("Vercel Next.js App Router API Endpoints", () => {
  describe("POST /api/feedback", () => {
    it("accepts valid feedback and returns 204", async () => {
      const req = makeNextRequest(
        "http://localhost/api/feedback",
        "POST",
        { office_id: "up-agr-bdo-achhnera", worked: true },
        "10.10.0.1"
      );
      const res = await feedbackPost(req);
      expect(res.status).toBe(204);
    });

    it("rejects invalid office_id with 400", async () => {
      const req = makeNextRequest(
        "http://localhost/api/feedback",
        "POST",
        { office_id: "bad id with spaces!", worked: true },
        "10.10.0.2"
      );
      const res = await feedbackPost(req);
      expect(res.status).toBe(400);
    });

    it("enforces rate limit of 10 requests per hour per IP", async () => {
      const ip = "10.10.0.99";
      for (let i = 0; i < 10; i++) {
        const req = makeNextRequest(
          "http://localhost/api/feedback",
          "POST",
          { office_id: "up-test-office", worked: false },
          ip
        );
        const res = await feedbackPost(req);
        expect(res.status).toBe(204);
      }
      const req11 = makeNextRequest(
        "http://localhost/api/feedback",
        "POST",
        { office_id: "up-test-office", worked: false },
        ip
      );
      const res11 = await feedbackPost(req11);
      expect(res11.status).toBe(429);
    });
  });

  describe("POST /api/report", () => {
    it("accepts valid error report and returns 204", async () => {
      const req = makeNextRequest(
        "http://localhost/api/report",
        "POST",
        {
          office_id: "up-test-office",
          reason: "not_working",
          details: "Number is continuously engaged.",
        },
        "10.10.1.1"
      );
      const res = await reportPost(req);
      expect(res.status).toBe(204);
    });

    it("rejects details exceeding 500 chars with 400", async () => {
      const longText = "a".repeat(501);
      const req = makeNextRequest(
        "http://localhost/api/report",
        "POST",
        {
          office_id: "up-test-office",
          reason: "not_working",
          details: longText,
        },
        "10.10.1.2"
      );
      const res = await reportPost(req);
      expect(res.status).toBe(400);
    });

    it("enforces rate limit of 5 reports per hour per IP", async () => {
      const ip = "10.10.1.88";
      for (let i = 0; i < 5; i++) {
        const req = makeNextRequest(
          "http://localhost/api/report",
          "POST",
          { reason: "moved" },
          ip
        );
        const res = await reportPost(req);
        expect(res.status).toBe(204);
      }
      const req6 = makeNextRequest(
        "http://localhost/api/report",
        "POST",
        { reason: "moved" },
        ip
      );
      const res6 = await reportPost(req6);
      expect(res6.status).toBe(429);
    });
  });

  describe("GET /api/pincode", () => {
    it("rejects invalid non-6-digit PINs with 400", async () => {
      const req = new Request("http://localhost/api/pincode?pin=2260");
      const res = await pincodeGet(req);
      expect(res.status).toBe(400);
    });

    it("resolves verified local UP PIN codes (e.g. 226301 Mohanlalganj, Lucknow) from index", async () => {
      const req = new Request("http://localhost/api/pincode?pin=226301");
      const res = await pincodeGet(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.status).toBe("up_exact");
      expect(json.matches.some((m: { district_id: string }) => m.district_id === "lucknow")).toBe(
        true
      );
    });
  });
});
