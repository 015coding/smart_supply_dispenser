import { describe, expect, it } from "vitest";
import { formatServiceDay, serviceDayFor } from "@/lib/domain/date";

describe("service day", () => {
  it("uses Bangkok time around UTC midnight", () => {
    expect(serviceDayFor(new Date("2026-08-22T17:00:00.000Z"))).toBe("2026-08-23");
    expect(serviceDayFor(new Date("2026-08-22T16:59:59.000Z"))).toBe("2026-08-22");
  });

  it("formats API service days without locale-dependent ordering", () => {
    expect(formatServiceDay(new Date("2026-08-23T08:30:00.000Z"))).toBe("2026-08-23");
  });
});
