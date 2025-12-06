import type { UUID } from "crypto";

// UUIDv7 implementation from https://gist.github.com/ali-master/e5e527944d7e2b010636a6f5b3321d95
export default function uuidv7(): UUID {
  /**
   * Initialize a random array with crypto.getRandomValues(), get the current timestamp with Date.now(),
   * fill the array from the timestamp, set version and variant, then return a UUID string.
   */
  const value = new Uint8Array(16);
  crypto.getRandomValues(value);

  // current timestamp in ms
  const timestamp = BigInt(Date.now());

  // timestamp (48 bits)
  value[0] = Number((timestamp >> 40n) & 0xffn);
  value[1] = Number((timestamp >> 32n) & 0xffn);
  value[2] = Number((timestamp >> 24n) & 0xffn);
  value[3] = Number((timestamp >> 16n) & 0xffn);
  value[4] = Number((timestamp >> 8n) & 0xffn);
  value[5] = Number(timestamp & 0xffn);

  // version (7) and variant (RFC 4122)
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  value[6] = (value[6]! & 0x0f) | 0x70;
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  value[8] = (value[8]! & 0x3f) | 0x80;

  const hex = Array.from(value)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  const uuid =
    `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}` as UUID;

  return uuid;
}
