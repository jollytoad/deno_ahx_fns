import { deleteCookie, getCookies, setCookie } from "$std/http/cookie.ts";
import { TOKEN_COOKIE } from "../constants.ts";
import { decodeTokenPayload } from "./decode.ts";

export function setCookieToken(
  req: Request,
  token: string | undefined,
  headers: Headers = new Headers(),
): Headers {
  if (token) {
    const url = new URL(req.url);

    const exp = decodeTokenPayload(token)?.exp;
    const now = Math.floor(Date.now() / 1000);
    const maxAge = exp ? exp - now : 0;

    setCookie(headers, {
      name: TOKEN_COOKIE,
      value: token,
      maxAge,
      sameSite: "Lax",
      domain: url.hostname,
      path: "/",
      secure: url.protocol === "https:",
      httpOnly: true,
    });
  }

  return headers;
}

export function getCookieToken(req: Request): string | undefined {
  return getCookies(req.headers)[TOKEN_COOKIE];
}

export function deleteCookieToken(
  req: Request,
  headers: Headers = new Headers(),
): Headers {
  deleteCookie(headers, TOKEN_COOKIE, {
    domain: new URL(req.url).hostname,
    path: "/",
  });

  return headers;
}
