import { z } from "zod";
import { errorResponse, jsonRequest } from "@/lib/api";
import { requireAdmin, requireSameOrigin } from "@/lib/admin-auth";
import { resourceSchema } from "@/lib/catalog-admin-schema";
import { saveCatalog } from "@/services/catalog-admin-db";
export const runtime = "nodejs";
export async function PUT(
  request: Request,
  context: { params: Promise<{ resource: string; id: string }> },
) {
  try {
    requireSameOrigin(request);
    await requireAdmin(true);
    const params = await context.params;
    return Response.json(
      await saveCatalog(
        resourceSchema.parse(params.resource),
        await jsonRequest(request),
        z.uuid().parse(params.id),
      ),
    );
  } catch (error) {
    return errorResponse(error);
  }
}
