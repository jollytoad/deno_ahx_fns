import { serve as serveAhx } from "./server.ts";
import type { ServeHandler, ServeInit, ServeOptions } from "./server.ts";
import { port } from "$http_fns/port.ts";
import { loadKeyAndCert } from "./secure_localhost.ts";

/**
 * Standard dev server for an addon.
 *
 * Starts a secure server if 'localhost-key.pem' & 'localhost-cert.pem'
 * files are present in the current working directory.
 *
 * Defaults to port 8000 unless the PORT env var is set.
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

export async function serve_(init: ServeInit) {
  return serveAhx({
    ...await loadKeyAndCert(),
    hostname: "::",
    port: port(),
    ...init,
  });
}
