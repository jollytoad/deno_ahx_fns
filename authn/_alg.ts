export type JwtAlg = keyof typeof algorithms;

type AlgorithmParams = Algorithm | RsaPssParams | EcdsaParams | EcKeyGenParams;

const algorithms = {
  ES256: { name: "ECDSA", hash: "SHA-256", namedCurve: "P-256" },
  ES384: { name: "ECDSA", hash: "SHA-384", namedCurve: "P-384" },
  ES512: { name: "ECDSA", hash: "SHA-512", namedCurve: "P-521" },
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

interface KeyAlgorithmVariant extends KeyAlgorithm {
  hash?: HashAlgorithmIdentifier;
  namedCurve?: NamedCurve;
}

/**
 * Get the JWT Algorithm name for a given CryptoKey
 */
export function jwtAlg(key: CryptoKey): JwtAlg | undefined {
  const prefix = algPrefix[key.algorithm.name] || undefined;
  const size = prefix && getHashAlg(key.algorithm);
  const alg = prefix && size && (`${prefix}${size}` as JwtAlg);
  return alg && algorithms[alg] ? alg : undefined;
}

function getHashAlg(
  { hash, namedCurve }: KeyAlgorithmVariant,
): string | undefined {
  if (typeof hash === "object") {
    hash = hash.name;
  }

  if (typeof hash === "string" && hash.startsWith("SHA-")) {
    return hash.slice(4);
  }

  if (typeof namedCurve === "string" && namedCurve.startsWith("P-")) {
    return namedCurve === "P-521" ? "512" : namedCurve.slice(2);
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
