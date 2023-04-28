import { deleteCookie, getCookies, setCookie } from "$std/http/cookie.ts";

const AHX_TOKEN = "ahx_token";

export function setTokenCookie(
  req: Request,
  token: string | undefined,
  headers: Headers = new Headers(),
): Headers {
  if (token) {
    setCookie(headers, {
      name: AHX_TOKEN,
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
  return getCookies(req.headers)[AHX_TOKEN];
}

export function deleteTokenCookie(
  req: Request,
  headers: Headers = new Headers(),
): Headers {
  deleteCookie(headers, AHX_TOKEN, {
    domain: new URL(req.url).hostname,
    path: "/",
  });

  return headers;
}
