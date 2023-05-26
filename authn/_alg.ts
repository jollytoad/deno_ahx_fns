export type JwtAlg = keyof typeof algorithms;

type AlgorithmParams = Algorithm | RsaPssParams | EcdsaParams | EcKeyGenParams;

const algorithms = {
  ES256: { name: "ECDSA", hash: "SHA-256", namedCurve: "P-256" },
  ES384: { name: "ECDSA", hash: "SHA-384", namedCurve: "P-384" },
  ES512: { name: "ECDSA", hash: "SHA-512", namedCurve: "P-512" },
  HS256: { name: "HMAC", hash: "SHA-256" },
  HS384: { name: "HMAC", hash: "SHA-384" },
  HS512: { name: "HMAC", hash: "SHA-512" },
  PS256: { name: "RSA-PSS", hash: "SHA-256", saltLength: 32 },
  PS384: { name: "RSA-PSS", hash: "SHA-384", saltLength: 48 },
  PS512: { name: "RSA-PSS", hash: "SHA-512", saltLength: 64 },
  RS256: { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
  RS384: { name: "RSASSA-PKCS1-v1_5", hash: "SHA-384" },
  RS512: { name: "RSASSA-PKCS1-v1_5", hash: "SHA-512" },
} satisfies Record<string, AlgorithmParams>;

const algPrefix: Record<string, string> = {
  "ECDSA": "ES",
  "HMAC": "HS",
  "RSASSA-PKCS1-v1_5": "RS",
  "RSA-PSS": "PS",
};

interface HashedKeyAlgorithm extends KeyAlgorithm {
  hash?: HashAlgorithmIdentifier;
}

/**
 * Get the JWT Algorithm name for a given CryptoKey
 */
export function jwtAlg(key: CryptoKey): JwtAlg | undefined {
  const algorithm = key.algorithm as HashedKeyAlgorithm;
  const prefix = algPrefix[algorithm.name];
  if (prefix) {
    const hash = typeof algorithm.hash === "object"
      ? algorithm.hash.name
      : algorithm.hash;
    if (typeof hash === "string" && hash.startsWith("SHA-")) {
      const alg = prefix + hash.slice(4) as JwtAlg;
      if (algorithms[alg]) {
        return alg;
      }
    }
  }
}

/**
 * Get the WebCrypto Algorithm from the given JWT Algorithm name
 */
export function cryptoAlg(
  alg: JwtAlg | string,
): AlgorithmParams | undefined {
  return algorithms[alg as JwtAlg];
}
