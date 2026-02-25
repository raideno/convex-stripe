import { v } from "convex/values";
import Stripe from "stripe";

import { defineActionImplementation } from "@/helpers";
import { BY_STRIPE_ID_INDEX_NAME } from "@/schema";
import { AccountStripeToConvex } from "@/schema/models/account";
import { storeDispatchTyped } from "@/store";

// TODO: won't be considering accountId, except for standard account type maybe
export const AccountsSyncImplementation = defineActionImplementation({
  args: v.object({
    accountId: v.optional(v.string()),
  }),
  name: "accounts",
  handler: async (context, args, configuration, options) => {
    if (configuration.sync.stripeAccounts !== true) return;

    const stripe = new Stripe(configuration.stripe.secret_key, {
      apiVersion: "2025-08-27.basil",
    });

    const localAccountsRes = await storeDispatchTyped(
      {
        operation: "selectAll",
        table: "stripeAccounts",
      },
      context,
      configuration,
      options,
    );
    const localAccountById = new Map(
      (localAccountsRes.docs || []).map((p) => [p.accountId, p]),
    );

    const accounts = await stripe.accounts
      .list({ limit: 100 })
      .autoPagingToArray({ limit: 10_000 });

    const stripeAccountIds = new Set<string>();

    for (const account of accounts) {
      stripeAccountIds.add(account.id);

      const entityId = account.metadata?.entityId;

      if (!entityId) {
        console.warn(`Account ${account.id} is missing entityId in metadata`);
        if (!configuration.detached) continue;
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

    for (const [accountId] of localAccountById.entries()) {
      if (!stripeAccountIds.has(accountId)) {
        await storeDispatchTyped(
          {
            operation: "deleteById",
            table: "stripeAccounts",
            indexName: BY_STRIPE_ID_INDEX_NAME,
            idField: "accountId",
            idValue: accountId,
          },
          context,
          configuration,
          options,
        );
      }
    }
  },
});
