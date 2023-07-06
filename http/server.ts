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

export type ServeInit = Deno.ServeInit & ServeOptions;

export type ServeOptions = (Deno.ServeOptions | Deno.ServeTlsOptions) & {
  quiet?: boolean;
  interceptors?: {
    request?: RequestInterceptor[];
    response?: ResponseInterceptor<Response>[];
    error?: ErrorInterceptor<Response>[];
  };
};

export type OnListenProps = Parameters<Required<ServeOptions>["onListen"]>[0];

export type ServeHandler = Deno.ServeHandler;

/**
 * @deprecated use ServeOptions/ServeInit
 */
export type ServeAhxInit = ServeOptions;

/**
 * Standard server for an addon.
 */
export function serve(init: ServeInit | ServeHandler): Promise<void>;

export function serve(
  handler: ServeHandler,
  options?: ServeOptions,
): Promise<void>;

export function serve(
  init: ServeInit | ServeHandler,
  options?: ServeOptions,
): Promise<void> {
  if (typeof init === "function") {
    return serve_({
      handler: init,
      ...options,
    });
  } else {
    return serve_(init);
  }
}

/**
 * Standard server for an addon.
 */
function serve_(
  { handler, quiet, interceptors, ...options }: ServeInit,
): Promise<void> {
  // Prevent unhandled rejections from crashing the server
  // This can happen when Request/Response are aborted
  globalThis.addEventListener("unhandledrejection", (e) => {
    console.warn("%cUnhandled rejection:", "color: red;", e.reason);
    e.preventDefault();
  });

  return Deno.serve(
    {
      onListen: quiet ? undefined : logServerUrl(options),
      ...options,
    },
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
  ).finished;
}

export function displayHost(hostname: string) {
  if (hostname === "::" || hostname === "0.0.0.0") {
    return "localhost";
  }
  return hostname;
}

export function getServerProtocol(options: ServeOptions): string {
  return hasKeyAndCert(options) ? "https" : "http";
}

export function getServerUrl(
  hostname: string,
  port: number,
  options: ServeOptions,
): string {
  return `${getServerProtocol(options)}://${displayHost(hostname)}:${port}`;
}

export function logServerUrl(options: ServeOptions) {
  return ({ hostname, port }: OnListenProps) => {
    console.log(getServerUrl(hostname, port, options));
  };
}

function hasKeyAndCert(options: ServeOptions): boolean {
  return "key" in options && !!options.key && "cert" in options &&
    !!options.cert;
}
