import { z } from "zod";
import { errorResponse, jsonRequest } from "@/lib/api";
import { requireAdmin, requireSameOrigin } from "@/lib/admin-auth";
import { cancelOrder } from "@/services/order-reader";
export const runtime = "nodejs";
const schema = z.object({ reason: z.string().trim().min(5).max(500) }).strict();
export async function POST(
  request: Request,
  context: { params: Promise<{ orderId: string }> },
) {
  try {
    requireSameOrigin(request);
    await requireAdmin(true);
    const id = z.uuid().parse((await context.params).orderId);
    return Response.json(
      await cancelOrder(id, schema.parse(await jsonRequest(request)).reason),
    );
  } catch (error) {
    return errorResponse(error);
  }
}
