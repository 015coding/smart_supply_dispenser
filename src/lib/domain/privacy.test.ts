import { describe, expect, it } from "vitest";
import { hashCitizenId, isValidThaiCitizenId, maskCitizenId, protectCitizenId, revealCitizenId } from "@/lib/domain/privacy";

describe("citizen identifier protection", () => {
  const citizenId = "1101700201601";
  const encryptionKey = "unit-test-encryption-key";
  const lookupKey = "unit-test-lookup-key";

  it("validates Thai citizen-id checksum", () => {
    expect(isValidThaiCitizenId(citizenId)).toBe(true);
    expect(isValidThaiCitizenId("1101700201602")).toBe(false);
    expect(isValidThaiCitizenId("123")).toBe(false);
  });

  it("round-trips encryption but never exposes the raw value in the protected value", () => {
    const protectedValue = protectCitizenId(citizenId, encryptionKey);
    expect(protectedValue).not.toContain(citizenId);
    expect(revealCitizenId(protectedValue, encryptionKey)).toBe(citizenId);
  });

  it("uses deterministic keyed lookup and masks display values", () => {
    expect(hashCitizenId(citizenId, lookupKey)).toBe(hashCitizenId(citizenId, lookupKey));
    expect(hashCitizenId(citizenId, lookupKey)).not.toBe(hashCitizenId(citizenId, "other-key"));
    expect(maskCitizenId(citizenId)).toBe("1101•••••••01");
  });
});
