export interface JwtHeader {
  alg: string;
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
