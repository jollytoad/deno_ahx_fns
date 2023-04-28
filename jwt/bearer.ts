export function getBearerToken(req: Request): string | undefined {
  const value = req.headers.get("Authorization") ?? "";
  const [scheme, credential] = value.split(" ", 2);
  if (scheme.toLowerCase() === "bearer") {
    return credential || undefined;
  }
}
