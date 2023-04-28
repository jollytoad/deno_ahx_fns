import { cryptoAlg, jwtAlg } from "./alg.ts";
import { encodeB64Url, encodeJsonPart, encodeUint8 } from "./encoding.ts";
import { getSigningKey } from "./key.ts";
import type { JwtClaims, JwtHeader } from "./types.ts";

/**
 * Create a JWT Token
 */
export async function createToken(
  req: Request,
  data: Record<string, string>,
): Promise<string | undefined> {
  const key = await getSigningKey();

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
    } satisfies JwtHeader,
  );

  const payloadPart = encodeJsonPart(
    {
      ...data,
      iat,
      exp: iat + (1 * 60 * 60),
      iss: url.origin,
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
