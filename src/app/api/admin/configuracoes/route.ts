import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { query } from "@/lib/db";
import { errorResponse } from "@/lib/api";

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
