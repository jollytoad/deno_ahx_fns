import { cryptoAlg } from "./alg.ts";
import * as store from "$store";
import type { Jwks } from "./types.ts";

let keyCache: Promise<Partial<CryptoKeyPair>> | undefined;

let jwksCache: Promise<Jwks> | undefined;

const STORE_KEY_PREFIX = ["ahx", "keys"];

const DEFAULT_MAX_ARCHIVED_AGE = 14 * 24 * 60 * 60; // 14 days

export async function getSigningKey(): Promise<CryptoKey | undefined> {
  return (await keyCache)?.privateKey;
}

export async function* getVerificationKeys(): AsyncIterable<CryptoKey> {
  const publicKey = (await keyCache)?.publicKey;
  if (publicKey) {
    yield publicKey;
  }

  // NOTE: we'll only get this far if verification against the current public key failed

  for await (
    const [, jwk] of store.listItems<JsonWebKey>([
      ...STORE_KEY_PREFIX,
      "public_archive",
    ])
  ) {
    const cryptoKey = await importCryptoKey(jwk, ["verify"]);
    if (cryptoKey) {
      console.debug("yielding archived key");
      yield cryptoKey;
    }
  }
}

export function getJwks(): Promise<Jwks> {
  if (!jwksCache) {
    jwksCache = generateJwks();
  }
  return jwksCache;
}

export async function initKeys(): Promise<void> {
  if (!keyCache) {
    keyCache = getCryptoKeyPair();
  }

  await keyCache;
}

export async function rotateKeys(): Promise<void> {
  const now = Math.floor(Date.now() / 1000);

  // Archive current key
  const publicKey = await readCryptoKey(["public"], ["verify"]);
  if (publicKey) {
    await writeCryptoKey(["public_archive", now], publicKey);
  }

  const keyPair = await generateKeyPair();

  await writeCryptoKeyPair(keyPair);
  keyCache = Promise.resolve(keyPair);
  jwksCache = undefined;

  await purgePublicKeys();
}

export async function purgePublicKeys(): Promise<number> {
  const now = Math.floor(Date.now() / 1000);
  const storageKeyPrefix = [...STORE_KEY_PREFIX, "public_archive"];
  const maxArchivedAge =
    Number.parseInt(Deno.env.get("PUBLIC_KEY_MAX_ARCHIVED_AGE") ?? "0") ||
    DEFAULT_MAX_ARCHIVED_AGE;
  let purgeCount = 0;

  for await (
    const [storageKey] of store.listItems<JsonWebKey>(storageKeyPrefix)
  ) {
    const archivedAt = storageKey[storageKeyPrefix.length];
    if (typeof archivedAt === "number") {
      const archivedAge = now - archivedAt;
      if (archivedAge > maxArchivedAge) {
        await store.removeItem(storageKey);
        purgeCount++;
      }
    }
  }

  if (purgeCount > 0) {
    jwksCache = undefined;
  }

  return purgeCount;
}

async function getCryptoKeyPair(): Promise<Partial<CryptoKeyPair>> {
  let keyPair = await readCryptoKeyPair();

  if (!keyPair.privateKey || !keyPair.publicKey) {
    keyPair = await generateKeyPair();
    await writeCryptoKeyPair(keyPair);
  }

  return keyPair;
}

async function readCryptoKeyPair(): Promise<Partial<CryptoKeyPair>> {
  return {
    privateKey: await readCryptoKey(["private"], ["sign"]),
    publicKey: await readCryptoKey(["public"], ["verify"]),
  };
}

async function readCryptoKey(
  id: (string | number)[],
  usage: KeyUsage[],
): Promise<CryptoKey | undefined> {
  const jwk = await store.getItem<JsonWebKey>([...STORE_KEY_PREFIX, ...id]);

  return jwk && importCryptoKey(jwk, usage);
}

function importCryptoKey(
  jwk: JsonWebKey,
  usage: KeyUsage[],
): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "jwk",
    jwk,
    cryptoAlg(jwk.alg!)!,
    true,
    usage,
  );
}

async function writeCryptoKeyPair(keys: Partial<CryptoKeyPair>): Promise<void> {
  await writeCryptoKey(["private"], keys.privateKey);
  await writeCryptoKey(["public"], keys.publicKey);
}

async function writeCryptoKey(
  id: (string | number)[],
  cryptoKey: CryptoKey | undefined,
): Promise<void> {
  if (cryptoKey) {
    const jwk = await crypto.subtle.exportKey("jwk", cryptoKey);
    await store.setItem<JsonWebKey>([...STORE_KEY_PREFIX, ...id], jwk);
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

async function generateJwks(): Promise<Jwks> {
  const keys: JsonWebKey[] = [];
  for await (const cryptoKey of getVerificationKeys()) {
    const jwk = await crypto.subtle.exportKey("jwk", cryptoKey);
    keys.push(jwk);
  }
  return { keys };
}
