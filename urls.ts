import { NAV_URL_HEADER, REQ_URL_HEADER } from "./constants.ts";

export interface AhxUrls {
  reqURL?: string;
  navURL?: string;
}

export function getAhxUrls(req: Request): AhxUrls {
  const reqURL = req.headers.get(REQ_URL_HEADER) || undefined;
  const navURL = req.headers.get(NAV_URL_HEADER) || reqURL;
  return { reqURL, navURL };
}
