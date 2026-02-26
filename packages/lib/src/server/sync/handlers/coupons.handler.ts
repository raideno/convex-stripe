import { v } from "convex/values";
import Stripe from "stripe";

import { defineActionImplementation } from "@/helpers";
import { BY_STRIPE_ID_INDEX_NAME } from "@/schema";
import { CouponStripeToConvex } from "@/schema/models/coupon";
import { storeDispatchTyped } from "@/store";

export const CouponsSyncImplementation = defineActionImplementation({
  args: v.object({
    accountId: v.optional(v.string()),
  }),
  name: "coupons",
  handler: async (context, args, configuration, options) => {
    if (configuration.sync.tables.stripeCoupons !== true) return;

    const stripe = new Stripe(configuration.stripe.secret_key, {
      apiVersion: configuration.stripe.version,
    });

    const coupons = await stripe.coupons
      .list({ limit: 100 }, { stripeAccount: args.accountId })
      .autoPagingToArray({ limit: 10_000 });

    const stripeCouponIds = new Set<string>();

    for (const coupon of coupons) {
      stripeCouponIds.add(coupon.id);

      await storeDispatchTyped(
        {
          operation: "upsert",
          table: "stripeCoupons",
          indexName: BY_STRIPE_ID_INDEX_NAME,
          idField: "couponId",
          data: {
            couponId: coupon.id,
            stripe: CouponStripeToConvex(coupon),
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
