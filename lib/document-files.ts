/** One-operation boundary for private Document viewing; replace with a fake in tests. */
export type DocumentFiles = { viewUrl(fileId: string): Promise<string> };

export function gatewayDocumentFiles(): DocumentFiles {
  return {
    async viewUrl(fileId) {
      const baseUrl = process.env.API_GATEWAY_URL;
      const callerKey = process.env.API_GATEWAY_CALLER_KEY;
      if (!baseUrl || !callerKey) throw new Error("Document viewing is not configured");
      const response = await fetch(`${baseUrl.replace(/\/$/, "")}/files/${encodeURIComponent(fileId)}`, {
        headers: { Authorization: `Bearer ${callerKey}` },
        cache: "no-store",
        signal: AbortSignal.timeout(10000),
      });
      if (!response.ok) throw new Error("Document File unavailable");
      const { url } = await response.json();
      if (typeof url !== "string" || new URL(url).protocol !== "https:") throw new Error("Invalid File address");
      return url;
    },
  };
}
