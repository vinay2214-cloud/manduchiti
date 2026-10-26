import { describe, it, expect, vi, beforeEach } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

// No live Gemini calls: a scripted fake stands in for the client, and sleep is recorded instead of waited.
const generateContent = vi.fn();
let failures: Error[] = [];
vi.mock("@/lib/gemini", async () => {
  const real = await vi.importActual<Record<string, unknown>>("@/lib/gemini-errors");
  const models = {
    generateContent: async (...args: unknown[]) => {
      const out = generateContent(...args);
      const f = failures.shift();
      if (f) throw f;
      return out;
    },
  };
  return { gemini: () => ({ models }), geminiModel: () => "test-model", ...real };
});
const sleep = vi.fn(async (_ms: number) => {});
vi.mock("@/lib/sleep", () => ({ sleep: (ms: number) => sleep(ms) }));

const { POST } = await import("@/app/api/extract/route");

const sample1 = JSON.parse(readFileSync(path.join(__dirname, "fixtures", "sample1_clean.json"), "utf8"));
// What the model returns: the fixture minus the server-assigned ids.
const modelReply = {
  text: JSON.stringify({ ...sample1, problem: null, medicines: sample1.medicines.map(({ id: _id, ...m }: { id: string }) => m) }),
};
const apiError = (status: number) => Object.assign(new Error(`{"error":{"code":${status}}}`), { status });
const abortError = () => Object.assign(new Error("This operation was aborted"), { name: "AbortError" });
function upload() {
  const form = new FormData();
  form.append("image", new Blob([new Uint8Array([0xff, 0xd8, 0xff])], { type: "image/jpeg" }), "sheet.jpg");
  return POST(new Request("http://x/api/extract", { method: "POST", body: form }));
}

beforeEach(() => {
  generateContent.mockReset();
  generateContent.mockReturnValue(modelReply);
  sleep.mockClear();
  failures = [];
});

describe("/api/extract retry on busy", () => {
  it("one call when Gemini answers first time", async () => {
    const res = await upload();
    expect(res.status).toBe(200);
    expect((await res.json()).medicines).toHaveLength(5);
    expect(generateContent).toHaveBeenCalledTimes(1);
    expect(sleep).not.toHaveBeenCalled();
  });
  it.each([503, 429])("a %s is retried once after ~2s, then succeeds", async (status) => {
    failures = [apiError(status)];
    const res = await upload();
    expect(res.status).toBe(200);
    expect(generateContent).toHaveBeenCalledTimes(2);
    expect(sleep).toHaveBeenCalledWith(2000);
  });
  it("busy twice → friendly busy after exactly 2 calls", async () => {
    failures = [apiError(503), apiError(503)];
    const res = await upload();
    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ error: "busy" });
    expect(generateContent).toHaveBeenCalledTimes(2);
  });
  it("a timeout is not retried — the time budget is already spent", async () => {
    failures = [abortError()];
    const res = await upload();
    expect(await res.json()).toEqual({ error: "busy" });
    expect(generateContent).toHaveBeenCalledTimes(1);
  });
  it("a malformed reply is not retried and never returns partial data", async () => {
    generateContent.mockReturnValue({ text: '{"document_ok": true, "medicines": [{"name": "X"}]}' });
    const res = await upload();
    expect(res.status).toBe(502);
    expect(await res.json()).toEqual({ error: "invalid" });
    expect(generateContent).toHaveBeenCalledTimes(1);
  });
  it("other API errors (e.g. 400) are not retried", async () => {
    failures = [apiError(400)];
    expect((await upload()).status).toBe(502);
    expect(generateContent).toHaveBeenCalledTimes(1);
  });
  it("both attempts share one time budget that ends before the 45s browser timeout", async () => {
    failures = [apiError(503)];
    await upload();
    const [first, second] = generateContent.mock.calls.map((c) => c[0].config.abortSignal as AbortSignal);
    expect(first).toBe(second);
  });
});
