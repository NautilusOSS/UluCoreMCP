/**
 * Normalization utilities for algod/indexer responses.
 *
 * Strategy: pass through raw data with minimal transformation.
 * - Convert BigInts to strings (JSON-safe)
 * - Convert Uint8Arrays to base64
 * - Preserve structure so consumers see what the chain returns
 */

export function normalize(obj) {
  return JSON.parse(JSON.stringify(obj, replacer));
}

function replacer(_key, value) {
  if (typeof value === "bigint") return value.toString();
  if (value instanceof Uint8Array) return Buffer.from(value).toString("base64");
  return value;
}

export function jsonResult(data) {
  return {
    content: [{ type: "text", text: JSON.stringify(normalize(data), null, 2) }],
  };
}
