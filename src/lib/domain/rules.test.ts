import { describe, expect, it } from "vitest";
import { availableBundleCount, deriveServiceStatus, validatePublishInput } from "@/lib/domain/rules";
import type { DispenserChannel } from "@/lib/domain/types";

const channel = (overrides: Partial<DispenserChannel> = {}): DispenserChannel => ({
  number: 1,
  supplyName: "น้ำดื่ม",
  unit: "ขวด",
  capacity: 40,
  balance: 10,
  lowStockThreshold: 5,
  enabled: true,
  ...overrides
});

describe("dispenser domain rules", () => {
  it("calculates complete bundles from the lowest enabled channel balance", () => {
    expect(availableBundleCount([channel({ balance: 10 }), channel({ number: 2, balance: 10 }), channel({ number: 3, balance: 9 })])).toBe(9);
    expect(availableBundleCount([channel({ balance: 10 }), channel({ number: 2, enabled: false, balance: 0 })])).toBe(10);
    expect(availableBundleCount([])).toBe(0);
  });

  it("derives service status from explicit overrides before stock", () => {
    const channels = [channel({ balance: 0 })];
    expect(deriveServiceStatus("published", "normal", channels)).toBe("out_of_stock");
    expect(deriveServiceStatus("published", "temporarily_closed", channels)).toBe("temporarily_closed");
    expect(deriveServiceStatus("published", "maintenance", channels)).toBe("maintenance");
  });

  it("rejects publishing incomplete dispensers", () => {
    const result = validatePublishInput({
      name: "",
      address: "ลานชุมชน",
      province: "ปทุมธานี",
      district: "คลองหลวง",
      latitude: null,
      longitude: 100.6,
      channels: [channel({ supplyName: "" })]
    });
    expect(result.valid).toBe(false);
    expect(result.fieldErrors.name).toBeDefined();
    expect(result.fieldErrors.latitude).toBeDefined();
    expect(result.fieldErrors.channels).toBeDefined();
  });
});
