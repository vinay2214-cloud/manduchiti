import { describe, it, expect } from "vitest";
import { schedule } from "@/lib/scheduler";

const s = (f: string | null, i: string | null = null) => schedule(f, i);

describe("digit patterns → direct", () => {
  it.each([
    ["1-0-1", ["morning", "night"]],
    ["1-1-1", ["morning", "afternoon", "night"]],
    ["1-0-0-1", ["morning", "night"]],
    ["0-1-1-0", ["afternoon", "evening"]],
    ["½-0-½", ["morning", "night"]],
    ["half-0-half", ["morning", "night"]],
  ])("%s", (f, slots) => {
    const r = s(f);
    expect(r.status).toBe("direct");
    expect(r.slots).toEqual(slots);
  });
  it("keeps non-1 quantities as written, never multiplied", () => {
    const r = s("2-0-1");
    expect(r.status).toBe("direct");
    expect(r.slots).toEqual(["morning", "night"]);
    expect(r.slotQuantities).toEqual({ morning: "2" });
  });
  it("food words alongside a pattern don't change it", () => {
    expect(s("1-0-1", "After food")).toMatchObject({ status: "direct", slots: ["morning", "night"] });
  });
});

describe("named times and meal words → direct", () => {
  it.each([
    ["At bedtime", null, ["night"]],
    ["HS", null, ["night"]],
    ["8 PM", null, ["night"]],
    ["Morning", null, ["morning"]],
    ["Night", null, ["night"]],
    ["HS", "Night", ["night"]],
  ])("%s / %s", (f, i, slots) => {
    expect(s(f, i)).toMatchObject({ status: "direct", slots });
  });
  it.each([
    ["breakfast", "morning"],
    ["lunch", "afternoon"],
    ["dinner", "night"],
  ])("OD + 'after %s' → %s", (meal, slot) => {
    expect(s("OD", `after ${meal}`)).toMatchObject({ status: "direct", slots: [slot] });
  });
  it("shows the written time on the row", () => {
    expect(s("8 PM").writtenTime).toBe("8 PM");
    expect(s("OD", "Morning").writtenTime).toBe("Morning");
  });
});

describe("clock boundaries are half-open", () => {
  it.each([
    ["04:59", "night"], ["05:00", "morning"], ["10:59", "morning"], ["11:00", "afternoon"],
    ["15:59", "afternoon"], ["16:00", "evening"], ["19:59", "evening"], ["20:00", "night"],
    ["8 AM", "morning"], ["12 PM", "afternoon"], ["12 AM", "night"],
  ])("%s → %s", (f, slot) => {
    expect(s(f)).toMatchObject({ status: "direct", slots: [slot] });
  });
});

describe("count only → suggested with defaults", () => {
  it.each([
    ["OD", ["morning"]],
    ["once daily", ["morning"]],
    ["BD", ["morning", "night"]],
    ["BID", ["morning", "night"]],
    ["twice daily", ["morning", "night"]],
    ["TDS", ["morning", "afternoon", "night"]],
    ["TID", ["morning", "afternoon", "night"]],
    ["QID", ["morning", "afternoon", "evening", "night"]],
  ])("%s", (f, slots) => {
    expect(s(f)).toMatchObject({ status: "suggested", slots });
  });
  it("food words alone never decide a slot", () => {
    expect(s("OD", "After food")).toMatchObject({ status: "suggested", slots: ["morning"] });
    expect(s("BD", "Before food")).toMatchObject({ status: "suggested", slots: ["morning", "night"] });
  });
});

describe("paper wins when count and named time agree", () => {
  it.each([
    ["OD", "Night", ["night"]],
    ["OD", "Morning", ["morning"]],
    ["OD", "30 min before breakfast", ["morning"]],
    ["OD", "Empty stomach, 30 min before breakfast", ["morning"]],
    ["BD", "Morning and night", ["morning", "night"]],
  ])("%s + %s", (f, i, slots) => {
    expect(s(f, i)).toMatchObject({ status: "direct", slots });
  });
});

describe("disagreements → ask with both texts", () => {
  it.each([
    ["BD", "Morning"],
    ["OD", "morning and night"],
    ["1-0-1", "Morning"],
    ["HS", "Morning"],
  ])("%s + %s", (f, i) => {
    const r = s(f, i);
    expect(r.status).toBe("ask");
    expect(r.slots).toEqual([]);
    expect(r.reason).toMatch(/don't match/);
  });
});

describe("anything else → ask, no slots", () => {
  it.each([
    ["As directed", null], ["Weekly", "Sunday"], [null, null], ["", null],
    ["1-0", null], ["1-0-1-0-1", null], ["x-0-1", null], ["blorp", null],
    // a frequency the sheet doesn't give can't be filled in from the instructions
    [null, "Night"], ["As directed", "Morning"], ["As directed in the morning", null],
  ])("%s / %s", (f, i) => {
    const r = s(f, i);
    expect(r.status).toBe("ask");
    expect(r.slots).toEqual([]);
  });
});

describe("as needed", () => {
  it.each([["SOS", "If fever"], ["PRN", null], ["if needed", null], ["SOS", "Chest pain, under tongue"], ["SOS", "Night"]])(
    "%s / %s → only if needed",
    (f, i) => {
      expect(s(f, i)).toMatchObject({ status: "as_needed", slots: [] });
    },
  );
});

describe("partial words are never completed", () => {
  it("OD + 'before breakf' → suggested morning, unsure", () => {
    expect(s("OD", "before breakf")).toMatchObject({ status: "suggested", slots: ["morning"], unsure: true });
  });
  it("OD + 'Empty stomach, 30 min before breakf' → suggested, unsure", () => {
    expect(s("OD", "Empty stomach, 30 min before breakf")).toMatchObject({ status: "suggested", unsure: true });
  });
  it("'after food' is not mistaken for a cut-off 'afternoon'", () => {
    expect(s("OD", "After food").unsure).toBe(false);
  });
});

describe("duration is stripped and kept as written", () => {
  it("OD x 3 days", () => {
    expect(s("OD x 3 days")).toMatchObject({ status: "suggested", slots: ["morning"], durationAsWritten: "x 3 days" });
  });
  it("1-0-1 for 5 days", () => {
    expect(s("1-0-1 for 5 days")).toMatchObject({ status: "direct", durationAsWritten: "for 5 days" });
  });
});

// prd.md > Amendments From 5-build: instructions never stand in for a missing or unclear frequency.
describe("amendment: a named time in the instructions needs a recognised frequency", () => {
  it.each([
    [null, "Night", "blank frequency"],
    ["", "Morning", "empty frequency"],
    ["blorp", "Morning", "unreadable frequency"],
    ["As directed", "Morning", "as directed"],
    ["Weekly", "Night", "weekly"],
    ["As directed in the morning", null, "as directed with a time inside the frequency"],
  ])("%s + %s (%s) → ask, no slots", (f, i) => {
    expect(s(f, i)).toMatchObject({ status: "ask", slots: [] });
  });
  it.each([
    ["HS", "Morning"],
    ["At bedtime", "Morning"],
    ["8 PM", "Morning"],
  ])("time-frequency %s disagreeing with %s → ask", (f, i) => {
    expect(s(f, i)).toMatchObject({ status: "ask", slots: [], reason: "Times on the sheet don't match" });
  });
  it.each([
    ["HS", "Night", ["night"]],
    ["At bedtime", "Night", ["night"]],
    ["8 PM", "Night", ["night"]],
  ])("time-frequency %s agreeing with %s → direct", (f, i, slots) => {
    expect(s(f, i)).toMatchObject({ status: "direct", slots });
  });
  it("a count plus a matching named time is still direct (paper wins)", () => {
    expect(s("OD", "Night")).toMatchObject({ status: "direct", slots: ["night"] });
  });
});
