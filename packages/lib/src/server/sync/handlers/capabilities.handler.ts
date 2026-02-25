import { v } from "convex/values";
import Stripe from "stripe";

import { defineActionImplementation } from "@/helpers";
import { BY_STRIPE_ID_INDEX_NAME } from "@/schema";
import { CapabilityStripeToConvex } from "@/schema/models/capability";
import { storeDispatchTyped } from "@/store";

export const CapabilitiesSyncImplementation = defineActionImplementation({
  args: v.object({}),
  name: "capabilities",
  handler: async (context, args, configuration, options) => {
    if (configuration.sync.stripeCapabilities !== true) return;

    const stripe = new Stripe(configuration.stripe.secret_key, {
      apiVersion: "2025-08-27.basil",
    });

    const localCapabilitiesRes = await storeDispatchTyped(
      {
        operation: "selectAll",
        table: "stripeCapabilities",
      },
      context,
      configuration,
      options,
    );
    const localCapabilitiesById = new Map(
      (localCapabilitiesRes.docs || []).map((p) => [p.capabilityId, p]),
    );

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

    for (const [capabilityId] of localCapabilitiesById.entries()) {
      if (!stripeCapabilityIds.has(capabilityId)) {
        await storeDispatchTyped(
          {
            operation: "deleteById",
            table: "stripeCapabilities",
            indexName: BY_STRIPE_ID_INDEX_NAME,
            idField: "capabilityId",
            idValue: capabilityId,
          },
          context,
          configuration,
          options,
        );
      }
    }
  },
});
