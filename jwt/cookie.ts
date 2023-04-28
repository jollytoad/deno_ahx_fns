import { deleteCookie, getCookies, setCookie } from "$std/http/cookie.ts";
import { TOKEN_COOKIE } from "../constants.ts";

export function setTokenCookie(
  req: Request,
  token: string | undefined,
  headers: Headers = new Headers(),
): Headers {
  if (token) {
    setCookie(headers, {
      name: TOKEN_COOKIE,
      value: token,
      maxAge: 3600,
      sameSite: "Lax",
      domain: new URL(req.url).hostname,
      path: "/",
      secure: true,
      httpOnly: true,
    });
  }

  return headers;
}

export function getTokenCookie(req: Request): string | undefined {
  return getCookies(req.headers)[TOKEN_COOKIE];
}

export function deleteTokenCookie(
  req: Request,
  headers: Headers = new Headers(),
): Headers {
  deleteCookie(headers, TOKEN_COOKIE, {
    domain: new URL(req.url).hostname,
    path: "/",
  });

  return headers;
}
