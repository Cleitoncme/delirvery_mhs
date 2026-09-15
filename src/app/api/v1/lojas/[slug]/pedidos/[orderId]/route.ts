import { z } from "zod";
import { errorResponse } from "@/lib/api";
import { readCustomerOrder } from "@/services/order-reader";
export const runtime = "nodejs";
export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string; orderId: string }> },
) {
  try {
    const { slug, orderId } = await context.params;
    return Response.json(
      await readCustomerOrder(
        z
          .string()
          .regex(/^[a-z0-9-]+$/)
          .max(80)
          .parse(slug),
        z.uuid().parse(orderId),
      ),
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    return errorResponse(error);
  }
}
