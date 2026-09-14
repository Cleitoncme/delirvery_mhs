import { z } from "zod";
import { errorResponse } from "@/lib/api";
import { getCatalog } from "@/services/catalog-db";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const slugSchema = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  .max(80);
export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await context.params;
    const catalog = await getCatalog(slugSchema.parse(slug));
    if (!catalog)
      return Response.json({ error: "Loja não encontrada." }, { status: 404 });
    return Response.json(catalog, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
