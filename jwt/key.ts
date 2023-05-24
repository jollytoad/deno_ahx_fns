import { cryptoAlg } from "./alg.ts";
import * as store from "$store";
import type { Jwks } from "./types.ts";

let keyCache: Promise<Partial<CryptoKeyPair>> | undefined;

let jwksCache: Promise<Jwks> | undefined;

const STORE_KEY_PREFIX = ["ahx", "keys"];

export async function getSigningKey(): Promise<CryptoKey | undefined> {
  return (await keyCache)?.privateKey;
}

export async function* getVerificationKeys(): AsyncIterable<CryptoKey> {
  const publicKey = (await keyCache)?.publicKey;
  if (publicKey) {
    yield publicKey;
  }
  // TODO: yield older keys
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
  const keyPair = await generateKeyPair();
  // TODO: copy current public key to old keys list
  await writeCryptoKeyPair(keyPair);
  keyCache = Promise.resolve(keyPair);
  jwksCache = undefined;
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
  id: string[],
  usage: KeyUsage[],
): Promise<CryptoKey | undefined> {
  const jwk = await store.getItem<JsonWebKey>([...STORE_KEY_PREFIX, ...id]);

  return jwk && crypto.subtle.importKey(
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
  id: string[],
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
