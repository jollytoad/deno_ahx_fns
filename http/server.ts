import {
  type Handler,
  serve as stdServe,
  type ServeInit,
} from "$std/http/server.ts";
import { intercept } from "$http_fns/intercept.ts";
import {
  logError,
  logGroupEnd,
  logRequestGroup,
  logStatusAndContentType,
} from "$http_fns/logger.ts";

/**
 * Standard server for an addon.
 */
export function serve(
  handler: Handler,
  options: ServeInit = {},
) {
  return stdServe(
    intercept(
      handler,
      [logRequestGroup],
      [logGroupEnd, logStatusAndContentType],
      [logGroupEnd, logError],
    ),
    options,
  );
}
