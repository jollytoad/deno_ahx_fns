import * as store from "$store";
import { verifyToken } from "../client/verify.ts";
import { decodeTokenPayload } from "../client/decode.ts";
import { getVerificationKeys } from "./keys.ts";
import { nowSecs } from "../_util.ts";
import type { JwtClaims } from "../types.ts";

const REVOKED_STORE_KEY_PREFIX = ["ahx", "revoked"];

/**
 * Add a token to a list of revoked tokens.
 * The token must have a jti claim.
 */
export async function revokeToken(
  req: Request,
  jwt: string | undefined,
): Promise<boolean> {
  const { exp, jti } = await verifyToken(req, jwt, getVerificationKeys) ?? {};

  if (jti && typeof exp === "number" && Number.isSafeInteger(exp) && exp > 0) {
    await store.setItem([...REVOKED_STORE_KEY_PREFIX, exp, jti], true);
    return true;
  }

  return false;
}

/**
 * Check whether a token has been explicitly revoked.
 */
export async function isTokenRevoked(
  _req: Request,
  jwt: string | JwtClaims | undefined,
): Promise<boolean> {
  const { exp, jti } =
    (typeof jwt === "string" ? decodeTokenPayload(jwt) : jwt) ?? {};

  if (jti && typeof exp === "number" && Number.isSafeInteger(exp) && exp > 0) {
    return !!await store.getItem([...REVOKED_STORE_KEY_PREFIX, exp, jti]);
  }

  return false;
}

/**
 * Purge revoked tokens once they have expired.
 */
export async function purgeRevokedTokens(): Promise<number> {
  const now = nowSecs();
  let purgeCount = 0;

  for await (const [key] of store.listItems(REVOKED_STORE_KEY_PREFIX)) {
    const exp = key[REVOKED_STORE_KEY_PREFIX.length];
    if (typeof exp === "number") {
      if (now > exp) {
        await store.removeItem(key);
        purgeCount++;
      }
    }
  }

  return purgeCount;
}
