import { errorResponse, jsonRequest } from "@/lib/api";
import { requireAdmin, requireSameOrigin } from "@/lib/admin-auth";
import { resourceSchema } from "@/lib/catalog-admin-schema";
import { saveCatalog } from "@/services/catalog-admin-db";
export const runtime = "nodejs";
export async function POST(
  request: Request,
  context: { params: Promise<{ resource: string }> },
) {
  try {
    requireSameOrigin(request);
    await requireAdmin(true);
    return Response.json(
      await saveCatalog(
        resourceSchema.parse((await context.params).resource),
        await jsonRequest(request),
      ),
      { status: 201 },
    );
  } catch (error) {
    return errorResponse(error);
  }
}
