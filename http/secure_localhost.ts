import { exists } from "$std/fs/exists.ts";
import type { ServeTlsInit } from "$std/http/server.ts";

const KEY_FILE = "localhost-key.pem";
const CERT_FILE = "localhost-cert.pem";

export async function loadTlsInit(): Promise<ServeTlsInit | undefined> {
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
