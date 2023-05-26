export interface GoogleClaims {
  hd?: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
  given_name?: string;
  family_name?: string;
}

export interface VerifyGoogleTokenOpts {
  clientId?: string;
  hostDomain?: string;
}
