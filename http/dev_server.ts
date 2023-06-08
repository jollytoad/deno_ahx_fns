import { serve as serveAhx, type ServeAhxInit } from "./server.ts";
import { port } from "$http_fns/port.ts";
import { loadTlsInit } from "./secure_localhost.ts";
import type { Handler } from "$std/http/server.ts";

/**
 * Standard dev server for an addon.
 *
 * Starts a secure server if 'localhost-key.pem' & 'localhost-cert.pem'
 * files are present in the current working directory.
 *
 * Defaults to port 8000 unless the PORT env var is set.
 */
export async function serve(
  handler: Handler,
  options: ServeAhxInit = {},
) {
  return serveAhx(handler, {
    ...await loadTlsInit(),
    hostname: "::",
    port: port(),
    ...options,
  });
}
