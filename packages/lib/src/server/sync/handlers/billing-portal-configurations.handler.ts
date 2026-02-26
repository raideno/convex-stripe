import { v } from "convex/values";
import Stripe from "stripe";

import { defineActionImplementation } from "@/helpers";
import { BY_STRIPE_ID_INDEX_NAME } from "@/schema";
import { BillingPortalConfigurationStripeToConvex } from "@/schema/models/billing-portal-configuration";
import { storeDispatchTyped } from "@/store";

export const BillingPortalConfigurationsSyncImplementation =
  defineActionImplementation({
    args: v.object({
      accountId: v.optional(v.string()),
    }),
    name: "billingPortalConfigurations",
    handler: async (context, args, configuration, options) => {
      if (configuration.sync.tables.stripeBillingPortalConfigurations !== true)
        return;

      const stripe = new Stripe(configuration.stripe.secret_key, {
        apiVersion: configuration.stripe.version,
      });

      const billingPortalConfigurations =
        await stripe.billingPortal.configurations
          .list({ limit: 100 }, { stripeAccount: args.accountId })
          .autoPagingToArray({ limit: 10_000 });

      const stripeBillingPortalConfigurationIds = new Set<string>();

      for (const billingPortalConfiguration of billingPortalConfigurations) {
        stripeBillingPortalConfigurationIds.add(billingPortalConfiguration.id);

        await storeDispatchTyped(
          {
            operation: "upsert",
            table: "stripeBillingPortalConfigurations",
            idField: "billingPortalConfigurationId",
            indexName: BY_STRIPE_ID_INDEX_NAME,
            data: {
              billingPortalConfigurationId: billingPortalConfiguration.id,
              stripe: BillingPortalConfigurationStripeToConvex(
                billingPortalConfiguration,
              ),
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
