import { verifyToken } from "../verify.ts";
import { getGoogleKeys } from "./keys.ts";
import type { GoogleClaims, VerifyGoogleTokenOpts } from "./types.ts";
import type { JwtClaims } from "../types.ts";

export async function verifyGoogleToken(
  req: Request,
  token: string | undefined,
  opts: VerifyGoogleTokenOpts,
): Promise<(JwtClaims & GoogleClaims) | undefined> {
  if (opts.clientId && token) {
    const payload = await verifyToken<GoogleClaims>(req, token, getGoogleKeys);

    if (payload) {
      if (
        payload.iss !== "accounts.google.com" &&
        payload.iss !== "https://accounts.google.com"
      ) {
        console.warn(`%cJWT: invalid issuer: ${payload.iss}`, "color: red;");
        return;
      }

      if (payload.aud !== opts.clientId) {
        console.warn(`%cJWT: invalid audience: ${payload.aud}`, "color: red;");
        return;
      }

      if (opts.hostDomain && payload.hd !== opts.hostDomain) {
        console.warn(`%cJWT: invalid domain: ${payload.hd}`, "color: red;");
        return;
      }

      if (!payload.email_verified) {
        console.warn(`%cJWT: email not verified`, "color: red;");
        return;
      }

      return payload;
    }
  }
}
