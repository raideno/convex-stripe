import { BY_STRIPE_ID_INDEX_NAME } from "@/schema";
import { PromotionCodeStripeToConvex } from "@/schema/models/promotion-code";
import { storeDispatchTyped } from "@/store";

import { defineWebhookHandler } from "../types";

export default defineWebhookHandler({
  events: ["promotion_code.created", "promotion_code.updated"],
  handle: async (event, context, configuration, options) => {
    if (configuration.sync.stripePromotionCodes !== true) return;

    const promotionCode = event.data.object;

    switch (event.type) {
      case "promotion_code.created":
      case "promotion_code.updated":
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
            },
          },
          context,
          configuration,
          options,
        );
        break;
    }
  },
});
