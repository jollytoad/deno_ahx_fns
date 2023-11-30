import { decodeJsonPart } from "../_encoding.ts";
import type { JwtClaims } from "../types.ts";

export function decodeTokenPayload<T>(
  jwt: string,
): (JwtClaims & T) | undefined {
  const parts = jwt?.split(".") ?? [];
  if (parts.length !== 3) return;
  return decodeJsonPart<JwtClaims & T>(parts[1]);
}
