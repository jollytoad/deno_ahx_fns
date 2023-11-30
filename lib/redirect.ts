import { getBodyAsObject } from "$http_fns/request/body_as_object.ts";
import { getSearchValues } from "$http_fns/request/search_values.ts";
import { seeOther } from "$http_fns/response/see_other.ts";
import { noContent } from "$http_fns/response/no_content.ts";
import { getAhxUrls } from "../lib/urls.ts";

export async function getRedirect(
  req: Request,
  redirect?: string,
): Promise<string | undefined> {
  if (!redirect) {
    if (req.method === "GET") {
      redirect = getSearchValues(req)("redirect")[0];
    } else if (req.method === "POST") {
      redirect = (await getBodyAsObject<{ redirect?: string } | undefined>(req))
        ?.redirect;
    }
  }

  if (!redirect) {
    redirect = req.headers.get("Referer") || undefined;
  }

  if (!redirect) {
    redirect = getAhxUrls(req).navURL;
  }

  if (!redirect) {
    redirect = new URL(req.url).origin;
  }

  return isValidRedirectUrl(redirect) ? redirect : undefined;
}

function isValidRedirectUrl(url?: string): url is string {
  try {
    new URL(url!);
    // TODO: validate URL
    return true;
  } catch {
    return false;
  }
}

export async function redirectResponse(
  req: Request,
  headers: Headers = new Headers(),
  redirect?: string,
): Promise<Response> {
  const location = await getRedirect(req, redirect);

  return location ? seeOther(location, headers) : noContent(headers);
}
