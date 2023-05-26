import * as store from "$store";
import { cryptoAlg } from "../_alg.ts";
import { nowSecs } from "../_util.ts";
import type { Jwks } from "../types.ts";

const PRIVATE_STORE_KEY = ["ahx", "keys", "private"];
const PUBLIC_STORE_KEY_PREFIX = ["ahx", "keys", "public"];

const DEFAULT_PUBLIC_KEY_MAX_AGE = 14 * 24 * 60 * 60; // 14 days

export async function getSigningKey(): Promise<CryptoKey> {
  const jwk = await store.getItem<JsonWebKey>(PRIVATE_STORE_KEY);
  let privateKey = jwk && await importCryptoKey(jwk, ['sign']);

  if (!privateKey) {
    ({ privateKey } = await generateKeyPair());
  }

  return privateKey;
}

export async function* getVerificationKeys(): AsyncIterable<CryptoKey> {
  for await (
    const [, jwk] of store.listItems<JsonWebKey>(PUBLIC_STORE_KEY_PREFIX)
  ) {
    const publicKey = await importCryptoKey(jwk, ["verify"]);
    if (publicKey) {
      yield publicKey;
    }
  }
}

export async function getJwks(): Promise<Jwks> {
  const keys: JsonWebKey[] = [];
  for await (
    const [, jwk] of store.listItems<JsonWebKey>(PUBLIC_STORE_KEY_PREFIX)
  ) {
    keys.push(jwk);
  }
  return { keys };
}

export async function rotateKeys(): Promise<void> {
  await generateKeyPair();
  await purgePublicKeys();
}

export async function purgePublicKeys(): Promise<number> {
  const now = nowSecs();
  const maxArchivedAge =
    Number.parseInt(Deno.env.get("PUBLIC_KEY_MAX_AGE") ?? "0") ||
    DEFAULT_PUBLIC_KEY_MAX_AGE;
  let purgeCount = 0;

  for await (
    const [storageKey] of store.listItems<JsonWebKey>(PUBLIC_STORE_KEY_PREFIX)
  ) {
    const archivedAt = storageKey[PUBLIC_STORE_KEY_PREFIX.length];
    if (typeof archivedAt === "number") {
      const archivedAge = now - archivedAt;
      if (archivedAge > maxArchivedAge) {
        await store.removeItem(storageKey);
        purgeCount++;
      }
    }
  }

  return purgeCount;
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

async function generateKeyPair(): Promise<CryptoKeyPair> {
  const now = nowSecs();

  const keyPair = await crypto.subtle.generateKey(
    {
      name: "RSA-PSS",
      hash: "SHA-256",
      modulusLength: 4096,
      publicExponent: new Uint8Array([1, 0, 1]),
    },
    true,
    ["sign", "verify"],
  );

  await writeCryptoKey([...PUBLIC_STORE_KEY_PREFIX, now], keyPair.publicKey);
  await writeCryptoKey(PRIVATE_STORE_KEY, keyPair.privateKey);

  return keyPair;
}

async function writeCryptoKey(
  storageKey: (string | number)[],
  cryptoKey: CryptoKey | undefined,
): Promise<void> {
  if (cryptoKey) {
    const jwk = await crypto.subtle.exportKey("jwk", cryptoKey);
    await store.setItem<JsonWebKey>(storageKey, jwk);
  }
}

