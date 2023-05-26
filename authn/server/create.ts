import { cryptoAlg, jwtAlg } from "../_alg.ts";
import { encodeB64Url, encodeJsonPart, encodeUint8 } from "../_encoding.ts";
import { jti } from "./_jti.ts";
import { getSigningKey } from "./keys.ts";
import type { JwtClaims, JwtHeader } from "../types.ts";

export interface CreateTokenOpts {
  lifetime?: number;
  key?: CryptoKey;
}

const DEFAULT_LIFETIME = 1 * 60 * 60; // 1 hour

/**
 * Create a JWT Token
 */
export async function createToken(
  req: Request,
  data: Record<string, unknown>,
  opts: CreateTokenOpts = {},
): Promise<string | undefined> {
  const key = opts.key ?? await getSigningKey();

  if (!key) {
    console.warn(`%cJWT: no signing key found`, "color: red;");
    return;
  }

  const alg = jwtAlg(key);
  if (!alg) {
    console.warn(`%cJWT: unsupported algorithm: ${alg}`, "color: red;");
    return;
  }

  const url = new URL(req.url);

  const iat = Math.floor(Date.now() / 1000);

  const headerPart = encodeJsonPart(
    {
      alg,
      typ: "JWT",
      kid: "kid" in key && typeof key.kid === "string" ? key.kid : undefined,
    } satisfies JwtHeader,
  );

  const payloadPart = encodeJsonPart(
    {
      ...data,
      iat,
      exp: iat + (opts.lifetime ?? DEFAULT_LIFETIME),
      iss: url.host,
      jti: jti(),
    } satisfies JwtClaims,
  );

  const headerAndPayloadParts = headerPart + "." + payloadPart;

  const signature = await crypto.subtle.sign(
    {
      ...cryptoAlg(alg),
      ...key.algorithm,
    },
    key,
    encodeUint8(headerAndPayloadParts),
  );

  const signaturePart = encodeB64Url(signature);

  return headerAndPayloadParts + "." + signaturePart;
}
