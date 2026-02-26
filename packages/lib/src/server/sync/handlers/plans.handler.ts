import { v } from "convex/values";
import Stripe from "stripe";

import { defineActionImplementation } from "@/helpers";
import { BY_STRIPE_ID_INDEX_NAME } from "@/schema";
import { PlanStripeToConvex } from "@/schema/models/plan";
import { storeDispatchTyped } from "@/store";

export const PlansSyncImplementation = defineActionImplementation({
  args: v.object({
    accountId: v.optional(v.string()),
  }),
  name: "plans",
  handler: async (context, args, configuration, options) => {
    if (configuration.sync.tables.stripePlans !== true) return;

    const stripe = new Stripe(configuration.stripe.secret_key, {
      apiVersion: configuration.stripe.version,
    });

    const plans = await stripe.plans
      .list(
        { limit: 100, expand: ["data.product"] },
        { stripeAccount: args.accountId },
      )
      .autoPagingToArray({ limit: 10_000 });

    const stripePlanIds = new Set<string>();

    for (const plan of plans) {
      stripePlanIds.add(plan.id);

      await storeDispatchTyped(
        {
          operation: "upsert",
          table: "stripePlans",
          indexName: BY_STRIPE_ID_INDEX_NAME,
          idField: "planId",
          data: {
            planId: plan.id,
            stripe: PlanStripeToConvex(plan),
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
