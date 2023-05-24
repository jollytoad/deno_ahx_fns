import type { JwtClaims, KeySupplier } from "./types.ts";
import { getVerificationKeys } from "./key.ts";
import { verifyToken } from "./verify.ts";
import { decodeTokenPayload } from "./decode.ts";
import * as store from "$store";

const EXPIRING_PREFIX = ["ahx", "revoked", "exp"];
const INFINITE_PREFIX = ["ahx", "revoked", "inf"];

/**
 * Add a token to a list of revoked tokens.
 * The token must have a jti claim.
 */
export async function revokeToken(
  req: Request,
  jwt?: string,
  keySupplier: KeySupplier = getVerificationKeys,
): Promise<boolean> {
  const claims = await verifyToken(req, jwt, keySupplier);

  if (jwt && claims && claims.jti) {
    await store.setItem([...prefix(claims.exp), claims.jti], jwt);
    return true;
  }

  return false;
}

/**
 * Check whether a token has been explicitly revoked.
 */
export async function isTokenRevoked(
  _req: Request,
  jwt?: string | JwtClaims,
): Promise<boolean> {
  const claims = typeof jwt === "string" ? decodeTokenPayload(jwt) : jwt;
  if (claims && claims.jti) {
    return !!await store.getItem([...prefix(claims.exp), claims.jti]);
  }
  return false;
}

/**
 * Purge revoked tokens that have an expiry time once they have expired.
 */
export async function purgeExpiredRevokedTokens(): Promise<number> {
  const now = Math.floor(Date.now() / 1000);
  let purgeCount = 0;

  for await (const [key] of store.listItems<string>(EXPIRING_PREFIX)) {
    const exp = key[EXPIRING_PREFIX.length];
    if (typeof exp === "number") {
      if (now > exp) {
        await store.removeItem(key);
        purgeCount++;
      }
    }
  }

  return purgeCount;
}

/**
 * Purge revoked tokens that don't have an expiry time if they are no longer valid.
 */
export async function purgeInfiniteRevokedTokens(
  req: Request,
  keySupplier: KeySupplier = getVerificationKeys,
): Promise<number> {
  let purgeCount = 0;

  for await (const [key, jwt] of store.listItems<string>(INFINITE_PREFIX)) {
    const valid = await verifyToken(req, jwt, keySupplier);
    if (!valid) {
      await store.removeItem(key);
      purgeCount++;
    }
  }

  return purgeCount;
}

function prefix(exp: unknown): (string | number)[] {
  if (typeof exp === "number" && Number.isSafeInteger(exp) && exp > 0) {
    return [...EXPIRING_PREFIX, exp];
  } else {
    return INFINITE_PREFIX;
  }
}
