import { describe, expect, it } from "vitest";
import { getSafeAdminRedirectPath } from "./auth-redirect";

describe("getSafeAdminRedirectPath", () => {
  const origin = "http://localhost:3000";

  it("keeps relative admin callback paths", () => {
    expect(getSafeAdminRedirectPath("/admin/dispensers?page=2", origin)).toBe("/admin/dispensers?page=2");
  });

  it("converts same-origin callback URLs to relative paths", () => {
    expect(getSafeAdminRedirectPath("http://localhost:3000/admin/activity", origin)).toBe("/admin/activity");
  });

  it("rejects a callback URL whose host differs from the browser origin", () => {
    expect(getSafeAdminRedirectPath("http://192.168.1.19:3000/admin", origin)).toBe("/admin");
  });

  it.each([null, "/", "/admin/login", "https://example.com/admin"])("falls back for %s", (value) => {
    expect(getSafeAdminRedirectPath(value, origin)).toBe("/admin");
  });
});
