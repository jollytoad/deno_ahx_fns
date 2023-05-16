import {
  type Handler,
  serve as stdServe,
  type ServeInit,
} from "$std/http/server.ts";
import { intercept, type ResponseInterceptor } from "$http_fns/intercept.ts";
import {
  logError,
  logGroupEnd,
  logRequestGroup,
  logStatusAndContentType,
} from "$http_fns/logger.ts";

interface ExtraInit {
  responseInterceptors?: ResponseInterceptor<Response>[];
}

/**
 * Standard server for an addon.
 */
export function serve(
  handler: Handler,
  { responseInterceptors = [], ...options }: ServeInit & ExtraInit = {},
) {
  return stdServe(
    intercept(
      handler,
      [logRequestGroup],
      [...responseInterceptors, logGroupEnd, logStatusAndContentType],
      [logGroupEnd, logError],
    ),
    options,
  );
}
