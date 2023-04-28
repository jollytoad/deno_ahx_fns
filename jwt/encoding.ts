import {
  decode as decodeB64Url,
  encode as encodeB64Url,
} from "$std/encoding/base64url.ts";

export { decodeB64Url, encodeB64Url };

export function encodeUint8(text: string): Uint8Array {
  return new TextEncoder().encode(text);
}

export function decodeUint8(data: BufferSource): string {
  return new TextDecoder().decode(data);
}

export function encodeJsonPart(data: unknown): string {
  return encodeB64Url(encodeUint8(JSON.stringify(data)));
}

export function decodeJsonPart<T>(part: string): T {
  return JSON.parse(decodeUint8(decodeB64Url(part)));
}
