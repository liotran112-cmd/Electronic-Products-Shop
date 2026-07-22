import { serve } from "inngest/next";

import { functions, inngest } from "@repo/events";

// Serves the durable sync pipeline (§3). Shopify/Sanity/Supabase webhook
// handlers emit events into `inngest`; these functions consume them with
// retries and idempotency.
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions,
});
