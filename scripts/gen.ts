import { generateRoutesModule } from "$http_fns/generate.ts";

function gen(dynamic = false) {
  return generateRoutesModule(
    "/",
    import.meta.resolve("@/routes"),
    import.meta.resolve("@/routes.ts"),
    {
      dynamic,
      httpFns: "$http_fns/",
    },
  );
}

export default gen;

if (import.meta.main) {
  await gen();
}
