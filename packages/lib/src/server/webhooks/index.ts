import { GenericActionCtx } from "convex/server";
import Stripe from "stripe";

import { StripeDataModel } from "@/schema";
import { InternalConfiguration, InternalOptions } from "@/types";

import { WebhookHandler } from "./types";

const HANDLERS_MODULES = Object.values(
  import.meta.glob("./handlers/*.handler.ts", {
    eager: true,
  })
) as unknown as Array<Record<string, WebhookHandler<Stripe.Event.Type>>>;

if (HANDLERS_MODULES.some((handler) => Object.keys(handler).length > 1))
  throw new Error(
    "Each webhook handler file should only have one export / default export"
  );

export const WEBHOOK_HANDLERS = HANDLERS_MODULES.map(
  (exports) => Object.values(exports)[0]
);

if (
  WEBHOOK_HANDLERS.some(
    (handler) => !["handle", "events"].every((key) => key in handler)
  )
)
  throw new Error(
    "Each webhook handler file should export a valid implementation"
  );

export const webhookImplementation = async (
  configuration: InternalConfiguration,
  options: InternalOptions,
  context: GenericActionCtx<StripeDataModel>,
  request: Request,
  stripe_?: Stripe
) => {
  const body = await request.text();
  const signature = request.headers.get("Stripe-Signature");

  if (!signature) return new Response("No signature", { status: 400 });

  const stripe = stripe_
    ? stripe_
    : new Stripe(configuration.stripe.secret_key, {
        apiVersion: "2025-08-27.basil",
      });

  if (typeof signature !== "string")
    return new Response("Invalid signature", { status: 400 });

  const event = await stripe.webhooks.constructEventAsync(
    body,
    signature,
    configuration.stripe.webhook_secret
  );

  options.logger.debug(`[STRIPE HOOK](RECEIVED): ${event.type}`);

  for (const handler of WEBHOOK_HANDLERS) {
    if (handler.events.includes(event.type)) {
      try {
        await handler.handle(event, context, configuration, options);
        options.logger.debug(`[STRIPE HOOK](HANDLED): ${event.type}`);
      } catch (error) {
        options.logger.error(`[STRIPE HOOK](Error): ${error}`);
      }
    }
  }

  return new Response("OK", { status: 200 });
};
