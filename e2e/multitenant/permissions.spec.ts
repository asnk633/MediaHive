import { test, expect } from "@playwright/test";

test("tenant isolation", async ({ request }) => {
  const r = await request.get("/api/tasks?tenantId=999");
  expect(r.status()).toBe(403);
});