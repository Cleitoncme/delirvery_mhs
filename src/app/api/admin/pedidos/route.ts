import { z } from "zod";
import { errorResponse } from "@/lib/api";
import { listAdminOrders } from "@/services/order-reader";
export const runtime = "nodejs";
export async function GET(request: Request) {
  try {
    const page = z.coerce
      .number()
      .int()
      .min(0)
      .max(10000)
      .parse(new URL(request.url).searchParams.get("page") ?? 0);
    return Response.json(await listAdminOrders(page), {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
