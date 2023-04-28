export interface AhxUrls {
  reqURL?: string;
  navURL?: string;
}

export function getAhxUrls(req: Request): AhxUrls {
  const reqURL = req.headers.get("AHX-Req-URL") || undefined;
  const navURL = req.headers.get("AHX-Nav-URL") || reqURL;
  return { reqURL, navURL };
}
