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
      if (configuration.sync.stripeSubscriptionSchedules !== true) return;

      const stripe = new Stripe(configuration.stripe.secret_key, {
        apiVersion: "2025-08-27.basil",
      });

      const localSubscriptionSchedulesRes = await storeDispatchTyped(
        {
          operation: "selectAll",
          table: "stripeSubscriptionSchedules",
        },
        context,
        configuration,
        options,
      );
      const localSubscriptionSchedulesById = new Map(
        (localSubscriptionSchedulesRes.docs || []).map((p) => [
          p.subscriptionScheduleId,
          p,
        ]),
      );

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

      // for (const [
      //   subscriptionScheduleId,
      // ] of localSubscriptionSchedulesById.entries()) {
      //   if (!stripeSubscriptionScheduleIds.has(subscriptionScheduleId)) {
      //     await storeDispatchTyped(
      //       {
      //         operation: "deleteById",
      //         table: "stripeSubscriptionSchedules",
      //         idField: "subscriptionScheduleId",
      //         indexName: BY_STRIPE_ID_INDEX_NAME,
      //         idValue: subscriptionScheduleId,
      //       },
      //       context,
      //       configuration,
      //       options,
      //     );
      //   }
      // }
    },
  });
