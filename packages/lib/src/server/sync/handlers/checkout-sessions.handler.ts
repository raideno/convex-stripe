import { v } from "convex/values";
import Stripe from "stripe";

import { defineActionImplementation } from "@/helpers";
import { CheckoutSessionStripeToConvex } from "@/schema/models/checkout-session";
import { storeDispatchTyped } from "@/store";
import { BY_STRIPE_ID_INDEX_NAME } from "@/schema";

export const CheckoutSessionsSyncImplementation = defineActionImplementation({
  args: v.object({}),
  name: "checkoutSessions",
  handler: async (context, args, configuration, options) => {
    if (configuration.sync.stripeCheckoutSessions !== true) return;

    const stripe = new Stripe(configuration.stripe.secret_key, {
      apiVersion: "2025-08-27.basil",
    });

    const localCheckoutSessionsRes = await storeDispatchTyped(
      {
        operation: "selectAll",
        table: "stripeCheckoutSessions",
      },
      context,
      configuration,
      options,
    );
    const localCheckoutSessionsById = new Map(
      (localCheckoutSessionsRes.docs || []).map((p: any) => [
        p.checkoutSessionId,
        p,
      ]),
    );

    const checkoutSessions = await stripe.checkout.sessions
      .list({ limit: 100 })
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
          },
        },
        context,
        configuration,
        options,
      );
    }

    for (const [checkoutSessionId] of localCheckoutSessionsById.entries()) {
      if (!stripeCheckoutSessionIds.has(checkoutSessionId)) {
        await storeDispatchTyped(
          {
            operation: "deleteById",
            table: "stripeCheckoutSessions",
            indexName: BY_STRIPE_ID_INDEX_NAME,
            idField: "checkoutSessionId",
            idValue: checkoutSessionId,
          },
          context,
          configuration,
          options,
        );
      }
    }
  },
});
