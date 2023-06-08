import { serve } from "../http/server.ts";
import handler from "@/handler.ts";

// Start a production dev server
await serve(handler);
