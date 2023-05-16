import { load } from "$std/dotenv/mod.ts";
import { exists } from "$std/fs/exists.ts";
import {
  type Handler,
  serve as serveStd,
  type ServeInit,
  serveTls,
  type ServeTlsInit,
} from "$std/http/server.ts";
import { port } from "$http_fns/port.ts";
import { intercept } from "$http_fns/intercept.ts";
import { cors } from "$http_fns/cors.ts";
import {
  logError,
  logGroupEnd,
  logRequestGroup,
  logStatusAndContentType,
} from "$http_fns/logger.ts";
import gen from "./gen.ts";
import handler from "@/handler.ts";

const KEY_FILE = "localhost-key.pem";
const CERT_FILE = "localhost-cert.pem";

await load({ export: true });
await gen();

const tlsInit = await loadTlsInit();

await serve(handler, {
  ...tlsInit,
  hostname: "::",
  port: port(),
  onListen: ({ hostname, port }) => {
    const protocol = tlsInit ? "https" : "http";
    console.log(
      `${protocol}://${displayHost(hostname)}:${port}`,
    );
  },
});

function serve(
  handler: Handler,
  options: ServeInit | ServeTlsInit = {},
) {
  const serveFn = tlsInit ? serveTls : serveStd;

  return serveFn(
    intercept(
      handler,
      [logRequestGroup],
      [cors(), logGroupEnd, logStatusAndContentType],
      [logGroupEnd, logError],
    ),
    options,
  );
}

async function loadTlsInit(): Promise<ServeTlsInit | undefined> {
  if (Deno.args.includes("--http")) {
    return;
  }
  if (
    await exists(KEY_FILE, { isFile: true, isReadable: true }) &&
    await exists(CERT_FILE, { isFile: true, isReadable: true })
  ) {
    return {
      key: await Deno.readTextFile(KEY_FILE),
      cert: await Deno.readTextFile(CERT_FILE),
    };
  }
}

function displayHost(hostname: string) {
  if (hostname === "::" || hostname === "0.0.0.0") {
    return "localhost";
  }
  return hostname;
}
