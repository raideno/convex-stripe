import { v } from "convex/values";
import Stripe from "stripe";

import { defineActionImplementation } from "@/helpers";
import { BY_STRIPE_ID_INDEX_NAME } from "@/schema";
import { TaxIdStripeToConvex } from "@/schema/models/tax-id";
import { storeDispatchTyped } from "@/store";

export const TaxIdsSyncImplementation = defineActionImplementation({
  args: v.object({
    accountId: v.optional(v.string()),
  }),
  name: "taxIds",
  handler: async (context, args, configuration, options) => {
    if (configuration.sync.tables.stripeTaxIds !== true) return;

    const stripe = new Stripe(configuration.stripe.secret_key, {
      apiVersion: configuration.stripe.version,
    });

    const taxIds = await stripe.taxIds
      .list({ limit: 100 }, { stripeAccount: args.accountId })
      .autoPagingToArray({ limit: 10_000 });

    const stripeTaxIdIds = new Set<string>();

    for (const taxId of taxIds) {
      stripeTaxIdIds.add(taxId.id);

      await storeDispatchTyped(
        {
          operation: "upsert",
          table: "stripeTaxIds",
          indexName: BY_STRIPE_ID_INDEX_NAME,
          idField: "taxIdId",
          data: {
            taxIdId: taxId.id,
            stripe: TaxIdStripeToConvex(taxId),
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
