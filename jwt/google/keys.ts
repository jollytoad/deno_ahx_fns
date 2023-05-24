import { keySupplierFromUrl } from "../jwks.ts";

export const getGoogleKeys = keySupplierFromUrl(
  "https://www.googleapis.com/oauth2/v3/certs",
);
