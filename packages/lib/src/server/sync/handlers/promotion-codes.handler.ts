import { v } from "convex/values";
import Stripe from "stripe";

import { defineActionImplementation } from "@/helpers";
import { BY_STRIPE_ID_INDEX_NAME } from "@/schema";
import { PromotionCodeStripeToConvex } from "@/schema/models/promotion-code";
import { storeDispatchTyped } from "@/store";

export const PromotionCodesSyncImplementation = defineActionImplementation({
  args: v.object({
    accountId: v.optional(v.string()),
  }),
  name: "promotionCodes",
  handler: async (context, args, configuration, options) => {
    if (configuration.sync.stripePromotionCodes !== true) return;

    const stripe = new Stripe(configuration.stripe.secret_key, {
      apiVersion: "2025-08-27.basil",
    });

    const localPromotionCodesRes = await storeDispatchTyped(
      {
        operation: "selectAll",
        table: "stripePromotionCodes",
      },
      context,
      configuration,
      options,
    );
    const localPromotionCodesById = new Map(
      (localPromotionCodesRes.docs || []).map((p) => [p.promotionCodeId, p]),
    );

    const promotionCodes = await stripe.promotionCodes
      .list({ limit: 100 }, { stripeAccount: args.accountId })
      .autoPagingToArray({ limit: 10_000 });

    const stripePromotionCodeIds = new Set<string>();

    for (const promotionCode of promotionCodes) {
      stripePromotionCodeIds.add(promotionCode.id);

      await storeDispatchTyped(
        {
          operation: "upsert",
          table: "stripePromotionCodes",
          indexName: BY_STRIPE_ID_INDEX_NAME,
          idField: "promotionCodeId",
          data: {
            promotionCodeId: promotionCode.id,
            stripe: PromotionCodeStripeToConvex(promotionCode),
            lastSyncedAt: Date.now(),
            accountId: args.accountId,
          },
        },
        context,
        configuration,
        options,
      );
    }

    // for (const [promotionCodeId] of localPromotionCodesById.entries()) {
    //   if (!stripePromotionCodeIds.has(promotionCodeId)) {
    //     await storeDispatchTyped(
    //       {
    //         operation: "deleteById",
    //         table: "stripePromotionCodes",
    //         indexName: BY_STRIPE_ID_INDEX_NAME,
    //         idField: "promotionCodeId",
    //         idValue: promotionCodeId,
    //       },
    //       context,
    //       configuration,
    //       options,
    //     );
    //   }
    // }
  },
});
