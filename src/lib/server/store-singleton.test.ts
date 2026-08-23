import { describe, expect, it, vi } from "vitest";

describe("server store singleton", () => {
  it("reuses one store when the module is evaluated by another route bundle", async () => {
    vi.resetModules();
    const firstModule = await import("./store");
    vi.resetModules();
    const secondModule = await import("./store");

    expect(secondModule.store).toBe(firstModule.store);
  });
});
