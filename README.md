# AHX Utility Functions

This is a bunch of utility functions for an experimental framework.

I would not recommending using it (yet).

## Import map requirements

An import map is required (see `deno.json`).

## Scripts

The scripts are designed to be run from the AHX addon project root, with the
root of the project mapped to `@/`, ie:

```json
{
  "imports": {
    "@/": "./"
  }
}
```

## Tasks

Here are tasks you can use to generate routes, and start dev or prod server, add
these to your `deno.json`:

```json
{
  "tasks": {
    "gen": "deno run --config=deno.json --allow-net --allow-read=./routes,./routes.ts --allow-write=./routes.ts https://deno.land/x/ahx_fns/scripts/gen.ts",
    "start": "deno run --config=deno.json --allow-env=PORT --allow-net --allow-read --allow-write=./routes.ts --watch https://deno.land/x/ahx_fns/scripts/dev.ts",
    "start:prod": "deno run --config=deno.json --allow-net --allow-read https://deno.land/x/ahx_fns/scripts/main.ts"
  },
},
{
  "imports": {
    "@/": "./"
  }
}
```
