import { v } from "convex/values";
import Stripe from "stripe";

import { defineActionImplementation } from "@/helpers";
import { BY_STRIPE_ID_INDEX_NAME } from "@/schema";
import { TaxIdStripeToConvex } from "@/schema/models/tax-id";
import { storeDispatchTyped } from "@/store";

export const TaxIdsSyncImplementation = defineActionImplementation({
  args: v.object({}),
  name: "taxIds",
  handler: async (context, args, configuration, options) => {
    if (configuration.sync.stripeTaxIds !== true) return;

    const stripe = new Stripe(configuration.stripe.secret_key, {
      apiVersion: "2025-08-27.basil",
    });

    const localTaxIdsRes = await storeDispatchTyped(
      {
        operation: "selectAll",
        table: "stripeTaxIds",
      },
      context,
      configuration,
      options,
    );
    const localTaxIdsById = new Map(
      (localTaxIdsRes.docs || []).map((p) => [p.taxIdId, p]),
    );

    const taxIds = await stripe.taxIds
      .list({ limit: 100 })
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
          },
        },
        context,
        configuration,
        options,
      );
    }

    for (const [taxIdId] of localTaxIdsById.entries()) {
      if (!stripeTaxIdIds.has(taxIdId)) {
        await storeDispatchTyped(
          {
            operation: "deleteById",
            table: "stripeTaxIds",
            indexName: BY_STRIPE_ID_INDEX_NAME,
            idField: "taxIdId",
            idValue: taxIdId,
          },
          context,
          configuration,
          options,
        );
      }
    }
  },
});
