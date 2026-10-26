import { describe, it, expect, vi, beforeEach } from "vitest";

// No live Gemini calls: the client is replaced with a scripted fake.
const generateContent = vi.fn();
// A plain function in front of the spy: a scripted failure is thrown here, after the spy has
// recorded the call, so the spy itself never holds a rejected promise.
let failWith: Error | null = null;
vi.mock("@/lib/gemini", async () => {
  const real = await vi.importActual<Record<string, unknown>>("@/lib/gemini-errors");
  const models = {
    generateContent: async (...args: unknown[]) => {
      const out = generateContent(...args);
      if (failWith) throw failWith;
      return out;
    },
  };
  return { gemini: () => ({ models }), geminiModel: () => "test-model", ...real };
});

const { POST } = await import("@/app/api/telugu/route");

const items = [
  { id: "warn:0", text: "Fever above 101 F for more than 2 days" },
  { id: "follow", text: "Review in 1 week with chest X-ray." },
];
const goodReply = {
  items: [
    { id: "warn:0", te: "2 రోజులకు పైగా 101 F కంటే ఎక్కువ జ్వరం" },
    { id: "follow", te: "1 వారంలో ఛాతీ ఎక్స్-రేతో చూపించుకోండి." },
  ],
};
const tampered = { items: [{ ...goodReply.items[0], te: "2 రోజులకు పైగా 102 F జ్వరం" }, goodReply.items[1]] };
const reply = (obj: unknown) => ({ text: JSON.stringify(obj) });
const call = (body: unknown) =>
  POST(new Request("http://x/api/telugu", { method: "POST", body: JSON.stringify(body), headers: { "content-type": "application/json" } }));
const apiError = (status: number) => Object.assign(new Error(`{"error":{"code":${status}}}`), { status });

beforeEach(() => {
  generateContent.mockReset();
  failWith = null;
});

describe("/api/telugu", () => {
  it("returns checked translations keyed by id in one call", async () => {
    generateContent.mockResolvedValueOnce(reply(goodReply));
    const res = await call({ items });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ translations: { "warn:0": goodReply.items[0].te, follow: goodReply.items[1].te } });
    expect(generateContent).toHaveBeenCalledTimes(1);
  });
  it("retries once when the guard rejects a changed number, then succeeds", async () => {
    generateContent.mockResolvedValueOnce(reply(tampered)).mockResolvedValueOnce(reply(goodReply));
    const res = await call({ items });
    expect(res.status).toBe(200);
    expect(generateContent).toHaveBeenCalledTimes(2);
  });
  it("gives up after the one retry and never returns the unchecked translation", async () => {
    generateContent.mockResolvedValue(reply(tampered));
    const res = await call({ items });
    expect(res.status).toBe(502);
    expect(await res.json()).toEqual({ error: "invalid" });
    expect(generateContent).toHaveBeenCalledTimes(2);
  });
  it("retries once on a malformed reply", async () => {
    generateContent.mockResolvedValueOnce({ text: "not json" }).mockResolvedValueOnce(reply(goodReply));
    expect((await call({ items })).status).toBe(200);
    expect(generateContent).toHaveBeenCalledTimes(2);
  });
  it.each([503, 429])("a %s is busy straight away, with no retry", async (status) => {
    failWith = apiError(status);
    const res = await call({ items });
    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ error: "busy" });
    expect(generateContent).toHaveBeenCalledTimes(1);
  });
  it("sends nothing to Gemini when there's no free text", async () => {
    const res = await call({ items: [] });
    expect(await res.json()).toEqual({ translations: {} });
    expect(generateContent).not.toHaveBeenCalled();
  });
  it("rejects a malformed request without calling Gemini", async () => {
    expect((await call({ items: [{ id: 1 }] })).status).toBe(400);
    expect(generateContent).not.toHaveBeenCalled();
  });
  it("sends the document text as data, not mixed into the instructions", async () => {
    generateContent.mockResolvedValueOnce(reply(goodReply));
    await call({ items });
    const parts = generateContent.mock.calls[0][0].contents[0].parts;
    expect(parts[0].text).toMatch(/translate/i);
    expect(JSON.parse(parts[1].text)).toEqual({ items });
  });
});
