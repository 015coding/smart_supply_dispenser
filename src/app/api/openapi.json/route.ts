import { json } from "@/lib/api/response";
import { openapiDocument } from "@/lib/openapi";

export const GET = () => json(openapiDocument, { headers: { "Cache-Control": "public, max-age=300" } });
