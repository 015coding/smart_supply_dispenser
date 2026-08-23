import { afterEach, describe, expect, it } from "vitest";
import { assertSameOrigin } from "./response";

const originalAuthUrl = process.env.AUTH_URL;
const originalNextAuthUrl = process.env.NEXTAUTH_URL;

function restoreEnvironment(): void {
  if (originalAuthUrl === undefined) delete process.env.AUTH_URL;
  else process.env.AUTH_URL = originalAuthUrl;

  if (originalNextAuthUrl === undefined) delete process.env.NEXTAUTH_URL;
  else process.env.NEXTAUTH_URL = originalNextAuthUrl;
}

function expectCsrfRejection(request: Request): void {
  try {
    assertSameOrigin(request);
    throw new Error("Expected CSRF rejection");
  } catch (error) {
    expect(error).toMatchObject({ status: 403, code: "csrf_rejected" });
  }
}

describe("assertSameOrigin", () => {
  afterEach(restoreEnvironment);

  it("accepts requests without an Origin header", () => {
    expect(() => assertSameOrigin(new Request("http://web:3000/api/v1/admin/dispensers"))).not.toThrow();
  });

  it("accepts an origin that matches the request URL", () => {
    const request = new Request("http://localhost:3000/api/v1/admin/dispensers", {
      headers: { Origin: "http://localhost:3000" }
    });
    expect(() => assertSameOrigin(request)).not.toThrow();
  });

  it("accepts the canonical AUTH_URL origin behind a reverse proxy", () => {
    process.env.AUTH_URL = "https://smart_supply_dispenser.kubits.org";
    const request = new Request("http://web:3000/api/v1/admin/dispensers", {
      headers: {
        Origin: "https://smart_supply_dispenser.kubits.org",
        "X-Forwarded-Host": "smart_supply_dispenser.kubits.org",
        "X-Forwarded-Proto": "https"
      }
    });
    expect(() => assertSameOrigin(request)).not.toThrow();
  });

  it("uses NEXTAUTH_URL as a backwards-compatible canonical origin", () => {
    delete process.env.AUTH_URL;
    process.env.NEXTAUTH_URL = "https://smart_supply_dispenser.kubits.org/admin";
    const request = new Request("http://web:3000/api/v1/admin/dispensers", {
      headers: { Origin: "https://smart_supply_dispenser.kubits.org" }
    });
    expect(() => assertSameOrigin(request)).not.toThrow();
  });

  it("rejects an untrusted origin even when forwarded headers are spoofed", () => {
    process.env.AUTH_URL = "https://smart_supply_dispenser.kubits.org";
    const request = new Request("http://web:3000/api/v1/admin/dispensers", {
      headers: {
        Origin: "https://evil.example",
        "X-Forwarded-Host": "evil.example",
        "X-Forwarded-Proto": "https"
      }
    });
    expectCsrfRejection(request);
  });

  it("rejects a malformed Origin header", () => {
    expectCsrfRejection(new Request("http://web:3000/api/v1/admin/dispensers", { headers: { Origin: "null" } }));
  });
});
