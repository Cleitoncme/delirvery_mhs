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
    const params = new URL(request.url).searchParams;
    const status = params.get("status");
    const search = params.get("search")?.trim().slice(0, 80);
    return Response.json(await listAdminOrders(page, { status: status ? z.enum(["NEW","PREPARING","READY","OUT_FOR_DELIVERY","COMPLETED","CANCELED"]).parse(status) : undefined, search: search || undefined }), {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
