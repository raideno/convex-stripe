import { BY_STRIPE_ID_INDEX_NAME } from "@/schema";
import { ReviewStripeToConvex } from "@/schema/models/review";
import { storeDispatchTyped } from "@/store";

import { defineWebhookHandler } from "@/webhooks/types";

export default defineWebhookHandler({
  events: ["review.closed", "review.opened"],
  handle: async (event, context, configuration, options) => {
    if (configuration.sync.tables.stripeReviews !== true) return;

    const review = event.data.object;

    switch (event.type) {
      case "review.closed":
      case "review.opened":
        await storeDispatchTyped(
          {
            operation: "upsert",
            table: "stripeReviews",
            indexName: BY_STRIPE_ID_INDEX_NAME,
            idField: "reviewId",
            data: {
              reviewId: review.id,
              stripe: ReviewStripeToConvex(review),
              lastSyncedAt: Date.now(),
              accountId: event.account,
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
