import { errorResponse } from "$http_fns/response.ts";
import { Status } from "$std/http/http_status.ts";
import { cryptoAlg } from "../_alg.ts";
import type { JwtHeader, KeySupplier } from "../types.ts";

export function keysFromUrl(url: string): KeySupplier {
  return async function* (_req: Request, header?: JwtHeader) {
    try {
      const response = await fetch(url);

      if (response.ok) {
        const { keys } = await response.json() as {
          keys: (JsonWebKey & { kid?: string })[];
        };

        for (const jwk of keys) {
          if (header?.kid && jwk.kid && header?.kid !== jwk.kid) {
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
      } else {
        throw response;
      }
    } catch (e) {
      console.error(e);
      throw errorResponse(
        `Failed to fetch public keys from ${url}`,
        Status.BadGateway,
      );
    }
  };
}
