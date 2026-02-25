import { v } from "convex/values";
import Stripe from "stripe";

import { defineActionImplementation } from "@/helpers";
import { BY_STRIPE_ID_INDEX_NAME } from "@/schema";
import { PlanStripeToConvex } from "@/schema/models/plan";
import { storeDispatchTyped } from "@/store";

export const PlansSyncImplementation = defineActionImplementation({
  args: v.object({}),
  name: "plans",
  handler: async (context, args, configuration, options) => {
    if (configuration.sync.stripePlans !== true) return;

    const stripe = new Stripe(configuration.stripe.secret_key, {
      apiVersion: "2025-08-27.basil",
    });

    const localPlansRes = await storeDispatchTyped(
      {
        operation: "selectAll",
        table: "stripePlans",
      },
      context,
      configuration,
      options,
    );
    const localPlansById = new Map(
      (localPlansRes.docs || []).map((p) => [p.planId, p]),
    );

    const plans = await stripe.plans
      .list({ limit: 100, expand: ["data.product"] })
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
          },
        },
        context,
        configuration,
        options,
      );
    }

    for (const [planId] of localPlansById.entries()) {
      if (!stripePlanIds.has(planId)) {
        await storeDispatchTyped(
          {
            operation: "deleteById",
            table: "stripePlans",
            indexName: BY_STRIPE_ID_INDEX_NAME,
            idField: "planId",
            idValue: planId,
          },
          context,
          configuration,
          options,
        );
      }
    }
  },
});
