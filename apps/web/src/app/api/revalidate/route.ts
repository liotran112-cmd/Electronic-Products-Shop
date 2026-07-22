import { revalidateTag } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";

import { serverEnv } from "@repo/env";

/**
 * On-demand ISR invalidation, called by the Inngest reindex pipeline after a
 * product's record changes (ARCHITECTURE §4.1). Secret-gated.
 */
export async function POST(request: NextRequest) {
  const env = serverEnv();
  if (!env.REVALIDATE_SECRET || request.headers.get("x-revalidate-secret") !== env.REVALIDATE_SECRET) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { tags } = (await request.json()) as { tags?: string[] };
  if (!Array.isArray(tags)) {
    return new NextResponse("Missing tags", { status: 400 });
  }

  for (const tag of tags) revalidateTag(tag);
  return NextResponse.json({ revalidated: true, tags });
}
