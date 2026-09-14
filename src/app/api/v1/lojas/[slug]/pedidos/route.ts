import { z } from "zod";
import { ApiError, errorResponse, jsonRequest } from "@/lib/api";
import { createOrder, createOrderSchema } from "@/services/orders-db";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const slugSchema = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  .max(80);
const idempotencySchema = z.string().uuid();
export async function POST(
  request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await context.params;
    const idempotencyKey = idempotencySchema.safeParse(
      request.headers.get("idempotency-key"),
    );
    if (!idempotencyKey.success)
      throw new ApiError(
        400,
        "O cabeçalho Idempetency-Key com UUID é obrigatório.",
      );
    const order = await createOrder(
      slugSchema.parse(slug),
      idempotencyKey.data,
      createOrderSchema.parse(await jsonRequest(request)),
    );
    return Response.json(order, {
      status: order.repeated ? 200 : 201,
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
