import { cryptoAlg } from "../_alg.ts";
import { decodeB64Url, decodeJsonPart, encodeUint8 } from "../_encoding.ts";
import type {
  JwtClaims,
  JwtHeader,
  KeySupplier,
  VerifyMode,
} from "../types.ts";

/**
 * Verify a JWT token and obtain it's payload
 */
export async function verifyToken<T>(
  req: Request,
  jwt: string | undefined,
  keySupplier: KeySupplier,
  mode: VerifyMode = "access",
): Promise<(JwtClaims & T) | undefined> {
  const parts = jwt?.split(".") ?? [];
  if (parts.length !== 3) return;

  const [headerPart, payloadPart, signaturePart] = parts;

  const header = decodeJsonPart<JwtHeader>(headerPart);
  const { typ, alg } = header;

  if (typ !== "JWT") return;

  const algorithm = cryptoAlg(alg);

  if (!algorithm) {
    console.warn(`%cJWT: unsupported algorithm: ${alg}`, "color: red;");
    return;
  }

  const headerAndPayloadParts = headerPart + "." + payloadPart;

  const now = Math.floor(Date.now() / 1000);

  const payload = decodeJsonPart<JwtClaims & T>(payloadPart);

  if (mode === "access") {
    if (payload.exp && Number.isFinite(payload.exp) && now > payload.exp) {
      console.warn("%cJWT: expired", "color: red;");
      return;
    }

    if (payload.nbf && Number.isFinite(payload.nbf) && now < payload.nbf) {
      console.warn("%cJWT: not before", "color: red;");
      return;
    }
  }

  for await (const key of keySupplier(req, header)) {
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
