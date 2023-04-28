import { serve } from "../http/server.ts";
import handler from "@/handler.ts";

await serve(handler);
