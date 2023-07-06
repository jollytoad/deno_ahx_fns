const KEY_FILE = "localhost-key.pem";
const CERT_FILE = "localhost-cert.pem";

export interface KeyAndCert {
  key: string;
  cert: string;
}

export async function loadKeyAndCert(): Promise<KeyAndCert | undefined> {
  if (Deno.args.includes("--http")) {
    return;
  }

  try {
    return {
      key: await Deno.readTextFile(KEY_FILE),
      cert: await Deno.readTextFile(CERT_FILE),
    };
  } catch (error) {
    if (!(error instanceof Deno.errors.NotFound)) {
      throw error;
    }
  }
}

export { loadKeyAndCert as loadTlsInit };
