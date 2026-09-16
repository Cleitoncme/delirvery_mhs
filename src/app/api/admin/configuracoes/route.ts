import { NextResponse } from "next/server";
import { requireAdmin, requireSameOrigin } from "@/lib/admin-auth";
import { query } from "@/lib/db";
import { errorResponse, jsonRequest } from "@/lib/api";
import { z } from "zod";
const schema = z.object({
  minimumOrderCents: z.number().int().nonnegative(),
  zones: z
    .array(
      z.object({
        minDistanceM: z.number().int().nonnegative(),
        maxDistanceM: z.number().int().positive(),
        feeCents: z.number().int().nonnegative(),
        active: z.boolean(),
      }),
    )
    .max(20),
});

export async function GET() {
  try {
    const session = await requireAdmin();
    const tenant = (
      await query(
        "SELECT name, slug, minimum_order_cents, latitude, longitude FROM tenants WHERE id=$1",
        [session.tenantId],
      )
    ).rows[0];
    const zones = (
      await query(
        "SELECT id, min_distance_m, max_distance_m, fee_cents, active, sort_order FROM delivery_zones WHERE tenant_id=$1 ORDER BY sort_order, min_distance_m",
        [session.tenantId],
      )
    ).rows;
    return NextResponse.json({ tenant, zones });
  } catch (error) {
    return errorResponse(error);
  }
}
export async function PUT(request: Request) {
  try {
    requireSameOrigin(request);
    const s = await requireAdmin(true);
    const input = schema.parse(await jsonRequest(request));
    const zones = [...input.zones].sort(
      (a, b) => a.minDistanceM - b.minDistanceM,
    );
    for (let i = 0; i < zones.length; i++)
      if (
        zones[i].maxDistanceM <= zones[i].minDistanceM ||
        (i > 0 && zones[i].minDistanceM < zones[i - 1].maxDistanceM)
      )
        throw new Error("Faixas inválidas.");
    await query(
      "UPDATE tenants SET minimum_order_cents=$1,updated_at=now() WHERE id=$2",
      [input.minimumOrderCents, s.tenantId],
    );
    await query("DELETE FROM delivery_zones WHERE tenant_id=$1", [s.tenantId]);
    for (const [z, x] of zones.entries())
      await query(
        "INSERT INTO delivery_zones(tenant_id,min_distance_m,max_distance_m,fee_cents,active,sort_order) VALUES($1,$2,$3,$4,$5,$6)",
        [s.tenantId, x.minDistanceM, x.maxDistanceM, x.feeCents, x.active, z],
      );
    return Response.json({ ok: true });
  } catch (e) {
    return errorResponse(e);
  }
}
