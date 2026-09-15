import { z } from "zod";
import { errorResponse, jsonRequest } from "@/lib/api";
import { requireSameOrigin, requireAdmin } from "@/lib/admin-auth";
import { advanceOrder } from "@/services/order-reader";
export const runtime = "nodejs";
const status = z.enum([
  "NEW",
  "PREPARING",
  "READY",
  "OUT_FOR_DELIVERY",
  "COMPLETED",
  "CANCELED",
]);
const schema = z.object({ expectedStatus: status, status }).strict();
export async function PATCH(
  request: Request,
  context: { params: Promise<{ orderId: string }> },
) {
  try {
    requireSameOrigin(request);
    await requireAdmin(true);
    const id = z.uuid().parse((await context.params).orderId);
    const input = schema.parse(await jsonRequest(request));
    return Response.json(
      await advanceOrder(id, input.expectedStatus, input.status),
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return errorResponse(error);
  }
}
