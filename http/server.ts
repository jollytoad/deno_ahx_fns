import {
  type Handler,
  serve as stdServe,
  serveTls as stdServeTls,
  type ServeTlsInit,
} from "$std/http/server.ts";
import {
  ErrorInterceptor,
  intercept,
  RequestInterceptor,
  type ResponseInterceptor,
} from "$http_fns/intercept.ts";
import {
  logError,
  logGroupEnd,
  logRequestGroup,
  logStatusAndContentType,
} from "$http_fns/logger.ts";

export interface ServeAhxInit extends ServeTlsInit {
  quiet?: boolean;
  interceptors?: {
    request?: RequestInterceptor[];
    response?: ResponseInterceptor<Response>[];
    error?: ErrorInterceptor<Response>[];
  };
}

/**
 * Standard server for an addon.
 */
export function serve(
  handler: Handler,
  { quiet, interceptors, ...options }: ServeAhxInit = {},
) {
  const serveFn = hasKeyAndCert(options) ? stdServeTls : stdServe;

  // Prevent unhandled rejections from crashing the server
  // This can happen when Request/Response are aborted
  globalThis.addEventListener("unhandledrejection", (e) => {
    console.warn("%cUnhandled rejection:", "color: red;", e.reason);
    e.preventDefault();
  });

  return serveFn(
    intercept(
      handler,
      quiet
        ? interceptors?.request ?? []
        : [logRequestGroup, ...interceptors?.request ?? []],
      quiet ? interceptors?.response ?? [] : [
        ...interceptors?.response ?? [],
        logGroupEnd,
        logStatusAndContentType,
      ],
      quiet
        ? interceptors?.error ?? []
        : [...interceptors?.error ?? [], logGroupEnd, logError],
    ),
    {
      onListen: quiet ? undefined : logServerUrl(options),
      ...options,
    },
  );
}

export function displayHost(hostname: string) {
  if (hostname === "::" || hostname === "0.0.0.0") {
    return "localhost";
  }
  return hostname;
}

type OnListenParam = Parameters<Required<ServeTlsInit>["onListen"]>[0];

export function logServerUrl(options: ServeTlsInit) {
  return ({ hostname, port }: OnListenParam) => {
    const protocol = hasKeyAndCert(options) ? "https" : "http";
    console.log(
      `${protocol}://${displayHost(hostname)}:${port}`,
    );
  };
}

function hasKeyAndCert(options: ServeTlsInit): boolean {
  return !!(options.key || options.keyFile) &&
    !!(options.cert || options.certFile);
}
