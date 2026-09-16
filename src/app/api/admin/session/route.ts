import { z } from "zod";
import { errorResponse, jsonRequest } from "@/lib/api";
import { loginAdmin, logoutAdmin, requireSameOrigin } from "@/lib/admin-auth";
export const runtime = "nodejs";
const schema = z
  .object({
    slug: z
      .string()
      .regex(/^[a-z0-9-]+$/)
      .max(80),
    email: z
      .email()
      .max(254)
      .transform((v) => v.toLowerCase()),
    password: z.string().min(1).max(256),
  })
  .strict();
export async function POST(request: Request) {
  try {
    requireSameOrigin(request);
    const input = schema.parse(await jsonRequest(request));
    await loginAdmin(input.slug, input.email, input.password);
    return Response.json(
      { ok: true },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return errorResponse(error);
  }
}
export async function DELETE(request: Request) {
  try {
    requireSameOrigin(request);
    await logoutAdmin();
    return new Response(null, { status: 204 });
  } catch (error) {
    return errorResponse(error);
  }
}
