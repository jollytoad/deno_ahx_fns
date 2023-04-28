import { cryptoAlg } from "./alg.ts";
import { decodeB64Url, decodeJsonPart, encodeUint8 } from "./encoding.ts";
import { getVerificationKeys } from "./key.ts";
import type { JwtClaims, JwtHeader } from "./types.ts";

/**
 * Verify a JWT token and obtain it's payload
 */
export async function verifyToken<T>(
  _req: Request,
  jwt?: string,
): Promise<(JwtClaims & T) | undefined> {
  const parts = jwt?.split(".") ?? [];
  if (parts.length !== 3) return;

  const [headerPart, payloadPart, signaturePart] = parts;

  const { alg, typ } = decodeJsonPart<JwtHeader>(headerPart);

  if (typ !== "JWT") return;

  const algorithm = cryptoAlg(alg);

  if (!algorithm) {
    console.warn(`%cJWT: unsupported algorithm: ${alg}`, "color: red;");
    return;
  }

  const headerAndPayloadParts = headerPart + "." + payloadPart;

  const now = Math.floor(Date.now() / 1000);

  const payload = decodeJsonPart<JwtClaims & T>(payloadPart);

  if (payload.exp && Number.isFinite(payload.exp) && now > payload.exp) {
    console.warn("%cJWT: expired", "color: red;");
    return;
  }

  if (payload.nbf && Number.isFinite(payload.nbf) && now < payload.nbf) {
    console.warn("%cJWT: not before", "color: red;");
    return;
  }

  for await (const key of getVerificationKeys()) {
    if (
      key.type === "private" || key.algorithm.name !== algorithm.name ||
      !key.usages.includes("verify")
    ) {
      continue;
    }

    if (
      await crypto.subtle.verify(
        {
          ...algorithm,
          ...key.algorithm,
        },
        key,
        decodeB64Url(signaturePart),
        encodeUint8(headerAndPayloadParts),
      )
    ) {
      console.debug("%cJWT: validated", "color: green;");
      return payload;
    }
  }

  console.warn("%cJWT: invalid signature", "color: red;");
}
