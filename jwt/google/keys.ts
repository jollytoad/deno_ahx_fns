import { cryptoAlg } from "../alg.ts";
import { JwtHeader } from "../types.ts";

export async function* getGoogleKeys(_req: Request, header: JwtHeader) {
  const response = await fetch("https://www.googleapis.com/oauth2/v3/certs");

  if (response.ok) {
    const { keys } = await response.json() as {
      keys: (JsonWebKey & { kid?: string })[];
    };

    for (const jwk of keys) {
      if (header.kid && jwk.kid && header.kid !== jwk.kid) {
        continue;
      }

      const key = await crypto.subtle.importKey(
        "jwk",
        jwk,
        cryptoAlg(jwk.alg!)!,
        true,
        ["verify"],
      );

      yield key;
    }
  }
}
