import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes } from "node:crypto";

function keyFromSecret(secret: string): Buffer {
  return createHash("sha256").update(secret, "utf8").digest();
}

function encode(value: Buffer): string {
  return value.toString("base64url");
}

function decode(value: string): Buffer {
  return Buffer.from(value, "base64url");
}

export function normalizeCitizenId(value: string): string {
  return value.replace(/[\s-]/g, "");
}

export function isValidThaiCitizenId(value: string): boolean {
  const citizenId = normalizeCitizenId(value);
  if (!/^\d{13}$/.test(citizenId)) return false;

  const sum = citizenId
    .slice(0, 12)
    .split("")
    .reduce((total, digit, index) => total + Number(digit) * (13 - index), 0);
  const checkDigit = (11 - (sum % 11)) % 10;
  return checkDigit === Number(citizenId[12]);
}

export function protectCitizenId(value: string, secret: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", keyFromSecret(secret), iv);
  const ciphertext = Buffer.concat([cipher.update(normalizeCitizenId(value), "utf8"), cipher.final()]);
  return `v1.${encode(iv)}.${encode(cipher.getAuthTag())}.${encode(ciphertext)}`;
}

export function revealCitizenId(protectedValue: string, secret: string): string {
  const [version, encodedIv, encodedTag, encodedCiphertext] = protectedValue.split(".");
  if (version !== "v1" || !encodedIv || !encodedTag || !encodedCiphertext) {
    throw new Error("Unsupported protected citizen identifier");
  }

  const decipher = createDecipheriv("aes-256-gcm", keyFromSecret(secret), decode(encodedIv));
  decipher.setAuthTag(decode(encodedTag));
  return Buffer.concat([decipher.update(decode(encodedCiphertext)), decipher.final()]).toString("utf8");
}

export function hashCitizenId(value: string, secret: string): string {
  return createHmac("sha256", keyFromSecret(secret)).update(normalizeCitizenId(value), "utf8").digest("hex");
}

export function maskCitizenId(value: string): string {
  const normalized = normalizeCitizenId(value);
  if (normalized.length <= 6) return "•".repeat(normalized.length);
  return `${normalized.slice(0, 4)}${"•".repeat(normalized.length - 6)}${normalized.slice(-2)}`;
}

export function encryptionSecret(): string {
  return process.env.PII_ENCRYPTION_KEY ?? "local-development-encryption-key";
}

export function lookupSecret(): string {
  return process.env.PII_LOOKUP_KEY ?? "local-development-lookup-key";
}
