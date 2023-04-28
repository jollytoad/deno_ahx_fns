import gen from "./gen.ts";
import { port } from "$http_fns/port.ts";
import { serve } from "../http/server.ts";
import handler from "@/handler.ts";

await gen();
await serve(handler, { port: port() });
