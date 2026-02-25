import { BY_STRIPE_ID_INDEX_NAME } from "@/schema";
import { CouponStripeToConvex } from "@/schema/models/coupon";
import { storeDispatchTyped } from "@/store";

import { defineWebhookHandler } from "@/webhooks/types";

export default defineWebhookHandler({
  events: ["coupon.created", "coupon.updated", "coupon.deleted"],
  handle: async (event, context, configuration, options) => {
    if (configuration.sync.stripeCoupons !== true) return;

    const coupon = event.data.object;

    switch (event.type) {
      case "coupon.created":
      case "coupon.updated":
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
              accountId: event.account,
            },
          },
          context,
          configuration,
          options,
        );
        break;
      case "coupon.deleted":
        await storeDispatchTyped(
          {
            operation: "deleteById",
            table: "stripeCoupons",
            indexName: BY_STRIPE_ID_INDEX_NAME,
            idField: "couponId",
            idValue: coupon.id,
          },
          context,
          configuration,
          options,
        );
        break;
    }
  },
});
