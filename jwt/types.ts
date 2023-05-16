export interface JwtHeader {
  alg: string;
  kid?: string;
  typ: "JWT";
}

export interface JwtClaims {
  iss?: string;
  sub?: string;
  aud?: string;
  iat?: number;
  nbf?: number;
  exp?: number;
  jti?: string;
}

export type KeySupplier = (
  req: Request,
  header: JwtHeader,
) => AsyncIterable<CryptoKey>;
