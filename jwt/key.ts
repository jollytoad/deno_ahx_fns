import { cryptoAlg } from "./alg.ts";
import { ensureDir } from "$std/fs/ensure_dir.ts";
import { dirname } from "$std/path/mod.ts";

let keyCache: CryptoKeyPair | undefined;

const PRIVATE_KEY_FILE = ".keys/private.jwk";
const PUBLIC_KEY_FILE = ".keys/public.jwk";

// deno-lint-ignore require-await
export async function getSigningKey(): Promise<CryptoKey | undefined> {
  return keyCache?.privateKey;
}

export async function* getVerificationKeys(): AsyncIterable<CryptoKey> {
  if (keyCache?.publicKey) {
    yield keyCache?.publicKey;
  }
}

export async function initKeys(): Promise<void> {
  if (!keyCache) {
    keyCache = await readCryptoKeyPair();
  }

  if (!keyCache) {
    keyCache = await generateKeyPair();
    await writeCryptoKeyPair(keyCache);
  }
}

async function readCryptoKeyPair(): Promise<CryptoKeyPair | undefined> {
  const privateJwk = await readJwk(PRIVATE_KEY_FILE);
  const publicJwk = await readJwk(PUBLIC_KEY_FILE);

  if (!privateJwk || !publicJwk) {
    return undefined;
  }

  const privateKey = await crypto.subtle.importKey(
    "jwk",
    privateJwk,
    cryptoAlg(privateJwk.alg!)!,
    true,
    ["sign"],
  );
  const publicKey = await crypto.subtle.importKey(
    "jwk",
    publicJwk,
    cryptoAlg(publicJwk.alg!)!,
    true,
    ["verify"],
  );

  return { privateKey, publicKey };
}

async function writeCryptoKeyPair(keys: CryptoKeyPair): Promise<void> {
  const privateJwk = await crypto.subtle.exportKey("jwk", keys.privateKey);
  const publicJwk = await crypto.subtle.exportKey("jwk", keys.publicKey);

  await writeJwk(PRIVATE_KEY_FILE, privateJwk);
  await writeJwk(PUBLIC_KEY_FILE, publicJwk);
}

async function readJwk(filename: string): Promise<JsonWebKey | undefined> {
  try {
    return JSON.parse(await Deno.readTextFile(filename));
  } catch (cause) {
    if (!(cause instanceof Deno.errors.NotFound)) {
      throw new Error(`Failed to read JWK file: ${filename}`, { cause });
    }
  }
}

async function writeJwk(filename: string, jwk: JsonWebKey): Promise<void> {
  try {
    await ensureDir(dirname(filename));
    await Deno.writeTextFile(filename, JSON.stringify(jwk));
  } catch (cause) {
    throw new Error(`Failed to write JWK file: ${filename}`, { cause });
  }
}

function generateKeyPair(): Promise<CryptoKeyPair> {
  return crypto.subtle.generateKey(
    {
      name: "RSA-PSS",
      hash: "SHA-256",
      modulusLength: 4096,
      publicExponent: new Uint8Array([1, 0, 1]),
    },
    true,
    ["sign", "verify"],
  );
}
