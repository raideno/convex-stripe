import { v } from "convex/values";
import Stripe from "stripe";

import { defineActionImplementation } from "@/helpers";
import { BY_STRIPE_ID_INDEX_NAME } from "@/schema";
import { ReviewStripeToConvex } from "@/schema/models/review";
import { storeDispatchTyped } from "@/store";

export const ReviewsSyncImplementation = defineActionImplementation({
  args: v.object({
    accountId: v.optional(v.string()),
  }),
  name: "reviews",
  handler: async (context, args, configuration, options) => {
    if (configuration.sync.tables.stripeReviews !== true) return;

    const stripe = new Stripe(configuration.stripe.secret_key, {
      apiVersion: configuration.stripe.version,
    });

    const reviews = await stripe.reviews
      .list({ limit: 100 }, { stripeAccount: args.accountId })
      .autoPagingToArray({ limit: 10_000 });

    const stripeReviewIds = new Set<string>();

    for (const review of reviews) {
      stripeReviewIds.add(review.id);

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
