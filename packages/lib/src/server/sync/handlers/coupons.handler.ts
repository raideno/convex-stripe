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
    if (configuration.sync.stripeCoupons !== true) return;

    const stripe = new Stripe(configuration.stripe.secret_key, {
      apiVersion: "2025-08-27.basil",
    });

    const localCouponsRes = await storeDispatchTyped(
      {
        operation: "selectAll",
        table: "stripeCoupons",
      },
      context,
      configuration,
      options,
    );
    const localCouponsById = new Map(
      (localCouponsRes.docs || []).map((p) => [p.couponId, p]),
    );

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

    for (const [couponId] of localCouponsById.entries()) {
      if (!stripeCouponIds.has(couponId)) {
        await storeDispatchTyped(
          {
            operation: "deleteById",
            table: "stripeCoupons",
            indexName: BY_STRIPE_ID_INDEX_NAME,
            idField: "couponId",
            idValue: couponId,
          },
          context,
          configuration,
          options,
        );
      }
    }
  },
});
