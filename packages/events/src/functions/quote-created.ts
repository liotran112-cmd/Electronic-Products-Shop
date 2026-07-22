import { inngest } from "../client";

/**
 * Fan-out for a new custom-device quote (§4.4): notify sales, ack the requester,
 * and create the internal tracking task. Email delivery is stubbed until Resend
 * is wired in Phase 4.
 */
export const quoteCreated = inngest.createFunction(
  { id: "quote-created", retries: 3 },
  { event: "quote/created" },
  async ({ event, step }) => {
    await step.run("email-sales-team", async () => {
      // TODO(phase-4): Resend -> sales inbox with quote reference
      return { reference: event.data.reference };
    });

    await step.run("ack-requester", async () => {
      // TODO(phase-4): Resend -> requester acknowledgement
      return { sent: true };
    });

    await step.run("create-internal-task", async () => {
      // TODO(phase-4): Supabase insert task with status=new
      return { created: true };
    });

    return { status: "notified" };
  },
);
