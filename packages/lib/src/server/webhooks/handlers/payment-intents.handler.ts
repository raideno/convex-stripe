import { BY_STRIPE_ID_INDEX_NAME } from "@/schema";
import { PaymentIntentStripeToConvex } from "@/schema/models/payment-intent";
import { storeDispatchTyped } from "@/store";

import { defineWebhookHandler } from "@/webhooks/types";

export default defineWebhookHandler({
  events: [
    "payment_intent.created",
    "payment_intent.amount_capturable_updated",
    "payment_intent.canceled",
    "payment_intent.partially_funded",
    "payment_intent.payment_failed",
    "payment_intent.processing",
    "payment_intent.requires_action",
    "payment_intent.succeeded",
  ],
  handle: async (event, context, configuration, options) => {
    if (configuration.sync.tables.stripePaymentIntents !== true) return;

    const paymentIntent = event.data.object;

    switch (event.type) {
      case "payment_intent.created":
      case "payment_intent.amount_capturable_updated":
      case "payment_intent.canceled":
      case "payment_intent.partially_funded":
      case "payment_intent.payment_failed":
      case "payment_intent.processing":
      case "payment_intent.requires_action":
      case "payment_intent.succeeded":
        await storeDispatchTyped(
          {
            operation: "upsert",
            table: "stripePaymentIntents",
            indexName: BY_STRIPE_ID_INDEX_NAME,
            idField: "paymentIntentId",
            data: {
              paymentIntentId: paymentIntent.id,
              stripe: PaymentIntentStripeToConvex(paymentIntent),
              lastSyncedAt: Date.now(),
              accountId: event.account,
            },
          },
          context,
          configuration,
          options,
        );
        break;
    }
  },
});
