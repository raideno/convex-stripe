import { v } from "convex/values";
import Stripe from "stripe";

import { defineActionImplementation } from "@/helpers";
import { BY_STRIPE_ID_INDEX_NAME } from "@/schema";
import { CapabilityStripeToConvex } from "@/schema/models/capability";
import { storeDispatchTyped } from "@/store";

// NOTE: won't be considering accountId, except for standard account type maybe
export const CapabilitiesSyncImplementation = defineActionImplementation({
  args: v.object({
    accountId: v.optional(v.string()),
  }),
  name: "capabilities",
  handler: async (context, args, configuration, options) => {
    if (configuration.sync.tables.stripeCapabilities !== true) return;

    const stripe = new Stripe(configuration.stripe.secret_key, {
      apiVersion: configuration.stripe.version,
    });

    const accounts = await stripe.accounts
      .list()
      .autoPagingToArray({ limit: 10_000 });

    const stripeCapabilityIds = new Set<string>();

    for (const account of accounts) {
      const capabilities = await stripe.accounts
        .listCapabilities(account.id)
        .autoPagingToArray({ limit: 10_000 });

      for (const capability of capabilities) {
        stripeCapabilityIds.add(capability.id);

        await storeDispatchTyped(
          {
            operation: "upsert",
            table: "stripeCapabilities",
            indexName: BY_STRIPE_ID_INDEX_NAME,
            idField: "capabilityId",
            data: {
              capabilityId: capability.id,
              stripe: CapabilityStripeToConvex(capability),
              lastSyncedAt: Date.now(),
              accountId: account.id,
            },
          },
          context,
          configuration,
          options,
        );
      }
    }
  },
});
