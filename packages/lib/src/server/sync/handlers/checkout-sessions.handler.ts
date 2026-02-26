import { v } from "convex/values";
import Stripe from "stripe";

import { defineActionImplementation } from "@/helpers";
import { CheckoutSessionStripeToConvex } from "@/schema/models/checkout-session";
import { storeDispatchTyped } from "@/store";
import { BY_STRIPE_ID_INDEX_NAME } from "@/schema";

export const CheckoutSessionsSyncImplementation = defineActionImplementation({
  args: v.object({
    accountId: v.optional(v.string()),
  }),
  name: "checkoutSessions",
  handler: async (context, args, configuration, options) => {
    if (configuration.sync.tables.stripeCheckoutSessions !== true) return;

    const stripe = new Stripe(configuration.stripe.secret_key, {
      apiVersion: configuration.stripe.version,
    });

    const checkoutSessions = await stripe.checkout.sessions
      .list({ limit: 100 }, { stripeAccount: args.accountId })
      .autoPagingToArray({ limit: 10_000 });

    const stripeCheckoutSessionIds = new Set<string>();

    for (const checkoutSession of checkoutSessions) {
      stripeCheckoutSessionIds.add(checkoutSession.id);

      await storeDispatchTyped(
        {
          operation: "upsert",
          table: "stripeCheckoutSessions",
          idField: "checkoutSessionId",
          indexName: BY_STRIPE_ID_INDEX_NAME,
          data: {
            checkoutSessionId: checkoutSession.id,
            stripe: CheckoutSessionStripeToConvex(checkoutSession),
            lastSyncedAt: Date.now(),
            accountId: args.accountId,
          },
        },
        context,
        configuration,
        options,
      );
    }
  },
});
