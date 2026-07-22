import { NextResponse } from "next/server";

import { createServiceClient, listFailedSyncEvents, syncStats } from "@repo/db";

/**
 * Operational health check (audit §7). Reports sync-pipeline stats and recent
 * dead-letter count over the last hour. Returns 503 if the DB is unreachable so
 * uptime monitors / load balancers can act.
 */
export async function GET() {
  const checks: Record<string, unknown> = {};
  let healthy = true;

  try {
    const db = createServiceClient();
    const since = new Date(Date.now() - 3_600_000).toISOString();
    const [stats, failures] = await Promise.all([
      syncStats(db, since),
      listFailedSyncEvents(db, 5),
    ]);
    checks.sync = { lastHour: stats, recentFailures: failures?.length ?? 0 };
  } catch (error) {
    healthy = false;
    checks.sync = { error: error instanceof Error ? error.message : String(error) };
  }

  return NextResponse.json(
    { status: healthy ? "ok" : "degraded", checks, ts: new Date().toISOString() },
    { status: healthy ? 200 : 503 },
  );
}
