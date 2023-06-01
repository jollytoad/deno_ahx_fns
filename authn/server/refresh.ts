import { cryptoAlg, jwtAlg } from "../_alg.ts";
import { decodeB64Url, encodeUint8 } from "../_encoding.ts";
import { KeySupplier, Tokens } from "../types.ts";

export async function verifyRefreshToken(
  req: Request,
  { access_token, refresh_token }: Tokens,
  keySupplier: KeySupplier,
): Promise<boolean> {
  if (!access_token || !refresh_token) {
    return false;
  }

  for await (const key of keySupplier(req)) {
    if (key.type === "private" || !key.usages.includes("verify")) {
      continue;
    }

    console.debug(key);

    const alg = jwtAlg(key);

    if (!alg) {
      continue;
    }

    if (
      await crypto.subtle.verify(
        {
          ...cryptoAlg(alg),
          ...key.algorithm,
        },
        key,
        decodeB64Url(refresh_token),
        encodeUint8(access_token),
      )
    ) {
      console.debug("%cJWT: refresh token validated", "color: green;");
      return true;
    }
  }

  console.warn("%cJWT: invalid refresh token", "color: red;");
  return false;
}
