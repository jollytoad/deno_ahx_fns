import { deleteCookie, getCookies, setCookie } from "$std/http/cookie.ts";
import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE } from "../constants.ts";
import { Tokens } from "../types.ts";
import { decodeTokenPayload } from "./decode.ts";

export function setCookieToken(
  req: Request,
  token: string | undefined,
  headers: Headers = new Headers(),
): Headers {
  return setCookieTokens(req, { access_token: token }, headers);
}

export function setCookieTokens(
  req: Request,
  { access_token, refresh_token }: Tokens,
  headers: Headers = new Headers(),
): Headers {
  if (access_token) {
    const url = new URL(req.url);

    const exp = decodeTokenPayload(access_token)?.exp;

    setCookie(headers, {
      name: ACCESS_TOKEN_COOKIE,
      value: access_token,
      expires: exp && new Date(exp * 1000),
      sameSite: "Lax",
      domain: url.hostname,
      path: "/",
      secure: url.protocol === "https:",
      httpOnly: true,
    });

    if (refresh_token) {
      setCookie(headers, {
        name: REFRESH_TOKEN_COOKIE,
        value: refresh_token,
        maxAge: 60 * 60 * 24 * 7,
        sameSite: "Strict",
        domain: url.hostname,
        path: "/",
        secure: url.protocol === "https:",
        httpOnly: true,
      });
    } else {
      deleteCookie(headers, REFRESH_TOKEN_COOKIE, {
        domain: url.hostname,
        path: "/",
      });
    }
  }

  return headers;
}

export function getCookieToken(req: Request): string | undefined {
  return getCookies(req.headers)[ACCESS_TOKEN_COOKIE];
}

export function getCookieTokens(req: Request): Tokens {
  return {
    access_token: getCookies(req.headers)[ACCESS_TOKEN_COOKIE],
    refresh_token: getCookies(req.headers)[REFRESH_TOKEN_COOKIE],
  };
}

export function deleteCookieTokens(
  req: Request,
  headers: Headers = new Headers(),
): Headers {
  const attrs = {
    domain: new URL(req.url).hostname,
    path: "/",
  };

  deleteCookie(headers, ACCESS_TOKEN_COOKIE, attrs);
  deleteCookie(headers, REFRESH_TOKEN_COOKIE, attrs);

  return headers;
}

export { deleteCookieTokens as deleteCookieToken };
