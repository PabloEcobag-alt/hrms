import { afterEach, expect, it, vi } from "vitest";
import { gatewayDocumentFiles } from "@/lib/document-files";
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });
it("requests a fresh signed URL through the HRMS gateway Caller", async () => {
  vi.stubEnv("API_GATEWAY_URL", "https://gateway.test/");
  vi.stubEnv("API_GATEWAY_CALLER_KEY", "hrms-key");
  const send = vi.fn().mockResolvedValue(Response.json({ url: "https://storage.test/signed" }));
  vi.stubGlobal("fetch", send);
  expect(await gatewayDocumentFiles().viewUrl("file/id")).toBe("https://storage.test/signed");
  expect(send).toHaveBeenCalledWith("https://gateway.test/files/file%2Fid", expect.objectContaining({
    headers: { Authorization: "Bearer hrms-key" }, cache: "no-store", signal: expect.any(AbortSignal),
  }));
});
it.each([undefined, "http://unsafe.test", "javascript:alert(1)"])("refuses invalid signed addresses %s", async (url) => {
  vi.stubEnv("API_GATEWAY_URL", "https://gateway.test");
  vi.stubEnv("API_GATEWAY_CALLER_KEY", "hrms-key");
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ url })));
  await expect(gatewayDocumentFiles().viewUrl("file")).rejects.toThrow();
});
it("refuses an unavailable gateway", async () => {
  vi.stubEnv("API_GATEWAY_URL", "https://gateway.test");
  vi.stubEnv("API_GATEWAY_CALLER_KEY", "hrms-key");
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 503 })));
  await expect(gatewayDocumentFiles().viewUrl("file")).rejects.toThrow();
});
it("requires gateway settings", async () => {
  vi.stubEnv("API_GATEWAY_URL", "");
  vi.stubEnv("API_GATEWAY_CALLER_KEY", "");
  await expect(gatewayDocumentFiles().viewUrl("file")).rejects.toThrow();
});
