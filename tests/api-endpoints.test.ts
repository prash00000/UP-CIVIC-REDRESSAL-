import { describe, it, expect } from "vitest";
import { handler as feedbackHandler } from "../netlify/functions/feedback";
import { handler as reportHandler } from "../netlify/functions/report";
import type { HandlerEvent, HandlerContext } from "@netlify/functions";

function makeMockEvent(method: string, body: any, ip: string = "192.168.1.100"): HandlerEvent {
  return {
    rawUrl: "http://localhost/api/test",
    rawQuery: "",
    path: "/api/test",
    httpMethod: method,
    headers: {
      "client-ip": ip,
      "content-type": "application/json",
    },
    multiValueHeaders: {},
    queryStringParameters: null,
    multiValueQueryStringParameters: null,
    isBase64Encoded: false,
    body: JSON.stringify(body),
  };
}

const mockContext: HandlerContext = {
  callbackWaitsForEmptyEventLoop: true,
  functionName: "test",
  functionVersion: "1",
  invokedFunctionArn: "arn",
  memoryLimitInMB: "128",
  awsRequestId: "req-1",
  logGroupName: "log",
  logStreamName: "stream",
  getRemainingTimeInMillis: () => 5000,
  done: () => {},
  fail: () => {},
  succeed: () => {},
};

describe("Netlify API Endpoints", () => {
  describe("POST /api/feedback", () => {
    it("should accept valid feedback and return 204", async () => {
      const event = makeMockEvent("POST", { office_id: "up-agr-bdo-achhnera", worked: true }, "10.0.0.1");
      const res = (await feedbackHandler(event, mockContext, () => {})) as any;
      expect(res.statusCode).toBe(204);
    });

    it("should reject invalid office_id with 400", async () => {
      const event = makeMockEvent("POST", { office_id: "bad id with spaces!", worked: true }, "10.0.0.2");
      const res = (await feedbackHandler(event, mockContext, () => {})) as any;
      expect(res.statusCode).toBe(400);
    });

    it("should enforce rate limit of 10 requests per hour per IP", async () => {
      const ip = "10.0.0.99";
      for (let i = 0; i < 10; i++) {
        const ev = makeMockEvent("POST", { office_id: "up-test-office", worked: false }, ip);
        const res = (await feedbackHandler(ev, mockContext, () => {})) as any;
        expect(res.statusCode).toBe(204);
      }
      // 11th call should return 429
      const ev11 = makeMockEvent("POST", { office_id: "up-test-office", worked: false }, ip);
      const res11 = (await feedbackHandler(ev11, mockContext, () => {})) as any;
      expect(res11.statusCode).toBe(429);
    });
  });

  describe("POST /api/report", () => {
    it("should accept valid error report and return 204", async () => {
      const event = makeMockEvent(
        "POST",
        {
          office_id: "up-test-office",
          reason: "not_working",
          details: "Number is continuously engaged.",
        },
        "10.0.1.1"
      );
      const res = (await reportHandler(event, mockContext, () => {})) as any;
      expect(res.statusCode).toBe(204);
    });

    it("should reject details exceeding 500 chars with 400", async () => {
      const longText = "a".repeat(501);
      const event = makeMockEvent(
        "POST",
        {
          office_id: "up-test-office",
          reason: "not_working",
          details: longText,
        },
        "10.0.1.2"
      );
      const res = (await reportHandler(event, mockContext, () => {})) as any;
      expect(res.statusCode).toBe(400);
    });

    it("should enforce rate limit of 5 reports per hour per IP", async () => {
      const ip = "10.0.1.88";
      for (let i = 0; i < 5; i++) {
        const ev = makeMockEvent("POST", { reason: "moved" }, ip);
        const res = (await reportHandler(ev, mockContext, () => {})) as any;
        expect(res.statusCode).toBe(204);
      }
      // 6th call should return 429
      const ev6 = makeMockEvent("POST", { reason: "moved" }, ip);
      const res6 = (await reportHandler(ev6, mockContext, () => {})) as any;
      expect(res6.statusCode).toBe(429);
    });
  });
});
