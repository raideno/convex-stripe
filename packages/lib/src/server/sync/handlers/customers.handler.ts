import { v } from "convex/values";
import Stripe from "stripe";

import { defineActionImplementation } from "@/helpers";
import { BY_STRIPE_ID_INDEX_NAME } from "@/schema";
import { CustomerStripeToConvex } from "@/schema/models/customer";
import { storeDispatchTyped } from "@/store";

export const CustomersSyncImplementation = defineActionImplementation({
  args: v.object({
    accountId: v.optional(v.string()),
  }),
  name: "customers",
  handler: async (context, args, configuration, options) => {
    if (configuration.sync.stripeCustomers !== true) return;

    const stripe = new Stripe(configuration.stripe.secret_key, {
      apiVersion: "2025-08-27.basil",
    });

    const localCustomersRes = await storeDispatchTyped(
      {
        operation: "selectAll",
        table: "stripeCustomers",
      },
      context,
      configuration,
      options,
    );
    const localCustomersById = new Map(
      (localCustomersRes.docs || []).map((p) => [p.customerId, p]),
    );

    const customers = await stripe.customers
      .list({ limit: 100 }, { stripeAccount: args.accountId })
      .autoPagingToArray({ limit: 10_000 });

    const stripeCustomerIds = new Set<string>();

    for (const customer of customers) {
      stripeCustomerIds.add(customer.id);

      const entityId = customer.metadata?.entityId;

      if (!entityId) {
        console.warn(`Customer ${customer.id} is missing entityId in metadata`);
        if (!configuration.detached) "";
      }

      await storeDispatchTyped(
        {
          operation: "upsert",
          table: "stripeCustomers",
          indexName: BY_STRIPE_ID_INDEX_NAME,
          idField: "customerId",
          data: {
            customerId: customer.id,
            entityId: entityId,
            stripe: CustomerStripeToConvex(customer),
            lastSyncedAt: Date.now(),
            accountId: args.accountId,
          },
        },
        context,
        configuration,
        options,
      );
    }

    for (const [customerId] of localCustomersById.entries()) {
      if (!stripeCustomerIds.has(customerId)) {
        await storeDispatchTyped(
          {
            operation: "deleteById",
            table: "stripeCustomers",
            indexName: BY_STRIPE_ID_INDEX_NAME,
            idField: "customerId",
            idValue: customerId,
          },
          context,
          configuration,
          options,
        );
      }
    }
  },
});
