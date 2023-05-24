import { customAlphabet } from "https://deno.land/x/nanoid@v3.0.0/customAlphabet.ts";

const alphabet =
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

export const jti = customAlphabet(alphabet, 24);
