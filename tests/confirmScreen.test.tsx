import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import ConfirmScreen from "@/components/ConfirmScreen";
import { buildConfirmState, confirmLabel, confirmRow, toggleSlot } from "@/lib/confirm";
import type { ConfirmState, Extraction } from "@/lib/types";

const fixture = (n: string) =>
  JSON.parse(readFileSync(path.join(__dirname, "fixtures", `${n}.json`), "utf8")) as Extraction;
const row = (st: ConfirmState, name: string) => st.rows.find((r) => r.name.original === name)!;
const noop = () => {};
const render = (st: ConfirmState) =>
  renderToStaticMarkup(<ConfirmScreen state={st} onChange={noop} onMakePlan={noop} onStartOver={noop} />);

describe("the suggested-time confirm says what it confirms", () => {
  const st = buildConfirmState(fixture("sample1_clean"));
  const metformin = row(st, "Tab Metformin"); // BD → morning + night

  it("names the times before the tap", () => {
    expect(confirmLabel(metformin)).toBe("Tap to confirm: Morning, Night");
  });
  it("names the times after the tap", () => {
    expect(confirmLabel(row(confirmRow(st, metformin.id), "Tab Metformin"))).toBe("Confirmed: Morning, Night");
  });
  it("follows the chips if the caregiver changes them first", () => {
    const moved = toggleSlot(st, metformin.id, "evening");
    expect(confirmLabel(row(moved, "Tab Metformin"))).toBe("Tap to confirm: Morning, Evening, Night");
  });
  it("changing a chip after confirming asks for the confirm again", () => {
    const confirmed = confirmRow(st, metformin.id);
    const changed = toggleSlot(confirmed, metformin.id, "night");
    expect(row(changed, "Tab Metformin").confirmed).toBe(false);
  });
  it("renders as a real, labelled button on the card", () => {
    const html = render(st);
    expect(html).toMatch(/<button[^>]*aria-pressed="false"[^>]*>[^]*?Tap to confirm: Morning, Night/);
  });
  it("direct rows have no confirm button", () => {
    const html = render(st);
    expect(html).not.toMatch(/Tap to confirm: Morning<\/span><\/button>[^]*Tab Amlodipine/);
    expect(confirmLabel(row(st, "Tab Amlodipine"))).toBe("");
  });
});

describe("the pending line jumps to the first unconfirmed card", () => {
  it("is a button pointing at the first unconfirmed suggested card", () => {
    const st = buildConfirmState(fixture("sample1_clean"));
    const first = st.rows.find((r) => r.schedule.status === "suggested")!;
    const html = render(st);
    expect(html).toMatch(new RegExp(`<button[^>]*data-jump="card-${first.id}"[^>]*>[^<]*Confirm the suggested times on 2 medicines`));
    expect(html).toContain(`id="card-${first.id}"`);
  });
  it("points at the next one once the first is confirmed", () => {
    let st = buildConfirmState(fixture("sample1_clean"));
    const [a, b] = st.rows.filter((r) => r.schedule.status === "suggested");
    st = confirmRow(st, a.id);
    expect(render(st)).toMatch(new RegExp(`data-jump="card-${b.id}"[^>]*>[^<]*Confirm the suggested times on 1 medicine ↑<`));
  });
});
