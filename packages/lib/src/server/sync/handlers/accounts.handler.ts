import { v } from "convex/values";
import Stripe from "stripe";

import { defineActionImplementation } from "@/helpers";
import { BY_STRIPE_ID_INDEX_NAME } from "@/schema";
import { AccountStripeToConvex } from "@/schema/models/account";
import { storeDispatchTyped } from "@/store";

// NOTE: won't be considering accountId, except for standard account type maybe
export const AccountsSyncImplementation = defineActionImplementation({
  args: v.object({
    accountId: v.optional(v.string()),
  }),
  name: "accounts",
  handler: async (context, args, configuration, options) => {
    if (configuration.sync.tables.stripeAccounts !== true) return;

    const stripe = new Stripe(configuration.stripe.secret_key, {
      apiVersion: configuration.stripe.version,
    });

    const accounts = await stripe.accounts
      .list({ limit: 100 })
      .autoPagingToArray({ limit: 10_000 });

    const stripeAccountIds = new Set<string>();

    for (const account of accounts) {
      stripeAccountIds.add(account.id);

      const entityId = account.metadata?.entityId;

      if (!entityId) {
        console.warn(`Account ${account.id} is missing entityId in metadata`);
        if (!configuration.detached) "";
      }

      await storeDispatchTyped(
        {
          operation: "upsert",
          table: "stripeAccounts",
          indexName: BY_STRIPE_ID_INDEX_NAME,
          idField: "accountId",
          data: {
            accountId: account.id,
            entityId: entityId,
            stripe: AccountStripeToConvex(account),
            lastSyncedAt: Date.now(),
          },
        },
        context,
        configuration,
        options,
      );
    }
  },
});
