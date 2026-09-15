import { errorResponse } from "@/lib/api";
import { readAdminCatalog } from "@/services/catalog-admin-db";
export const runtime = "nodejs";
export async function GET() {
  try {
    return Response.json(await readAdminCatalog(), {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
