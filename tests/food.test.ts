import { describe, it, expect } from "vitest";
import { foodDisplay } from "@/lib/food";

describe("foodDisplay", () => {
  it.each([
    ["Before food", "before"], ["before meals", "before"], ["a/c", "before"],
    ["After food", "after"], ["after meals", "after"], ["p/c", "after"], ["After food.", "after"],
    ["With food", "with"], ["with meals", "with"],
  ])("%s → %s chip", (t, chip) => {
    expect(foodDisplay(t)).toEqual({ kind: "chip", chip });
  });
  it.each(["Empty stomach", "30 min before breakfast", "after breakfast", "If fever", "Morning", "Chest pain, under tongue"])(
    "%s → text as written, never the nearest chip",
    (t) => {
      expect(foodDisplay(t)).toEqual({ kind: "text", text: t });
    },
  );
  it.each([null, "", "   "])("blank (%j) → none", (t) => {
    expect(foodDisplay(t)).toEqual({ kind: "none" });
  });
});
