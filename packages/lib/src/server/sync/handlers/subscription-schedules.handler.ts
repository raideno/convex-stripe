import { v } from "convex/values";
import Stripe from "stripe";

import { defineActionImplementation } from "@/helpers";
import { BY_STRIPE_ID_INDEX_NAME } from "@/schema";
import { SubscriptionScheduleStripeToConvex } from "@/schema/models/subscription-schedule";
import { storeDispatchTyped } from "@/store";

export const SubscriptionSchedulesSyncImplementation =
  defineActionImplementation({
    args: v.object({
      accountId: v.optional(v.string()),
    }),
    name: "subscriptionSchedules",
    handler: async (context, args, configuration, options) => {
      if (configuration.sync.tables.stripeSubscriptionSchedules !== true)
        return;

      const stripe = new Stripe(configuration.stripe.secret_key, {
        apiVersion: configuration.stripe.version,
      });

      const subscriptionSchedules = await stripe.subscriptionSchedules
        .list({ limit: 100 }, { stripeAccount: args.accountId })
        .autoPagingToArray({ limit: 10_000 });

      const stripeSubscriptionScheduleIds = new Set<string>();

      for (const subscriptionSchedule of subscriptionSchedules) {
        stripeSubscriptionScheduleIds.add(subscriptionSchedule.id);

        await storeDispatchTyped(
          {
            operation: "upsert",
            table: "stripeSubscriptionSchedules",
            idField: "subscriptionScheduleId",
            indexName: BY_STRIPE_ID_INDEX_NAME,
            data: {
              subscriptionScheduleId: subscriptionSchedule.id,
              stripe: SubscriptionScheduleStripeToConvex(subscriptionSchedule),
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
