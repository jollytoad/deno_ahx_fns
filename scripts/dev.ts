import { load } from "$std/dotenv/mod.ts";
import { serve } from "../http/dev_server.ts";
import gen from "./gen.ts";
import handler from "@/handler.ts";

// Load environment variables from .env
await load({ export: true });

// Generate a router.ts from @/routes/* if it exists
await gen();

// Start a localhost dev server (secure if 'localhost-key.pem' & 'localhost-cert.pem' files are present)
await serve(handler);
