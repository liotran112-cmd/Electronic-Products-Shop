import { Resend } from "resend";

import { serverEnv } from "@repo/env";

/**
 * Transactional email (Resend). SERVER-ONLY. Used by Inngest functions and
 * Route Handlers for quote acknowledgements, clarification requests, firmware
 * alerts, etc. (ARCHITECTURE §2/§3). Marketing automation stays in Shopify.
 */
let cached: Resend | undefined;

export function resend(): Resend {
  if (!cached) cached = new Resend(serverEnv().RESEND_API_KEY);
  return cached;
}

export const EMAIL_FROM = "Ampere <no-reply@ampere.example>";
export const EMAIL_SALES = "sales@ampere.example";
