import { v } from "convex/values";
import Stripe from "stripe";

import { defineActionImplementation } from "@/helpers";
import { BillingPortalConfigurationStripeToConvex } from "@/schema/billing-portal-configuration";
import { storeDispatchTyped } from "@/store";

export const BillingPortalConfigurationsSyncImplementation =
  defineActionImplementation({
    args: v.object({}),
    name: "billingPortalConfigurations",
    handler: async (context, args, configuration) => {
      if (configuration.sync.stripeBillingPortalConfigurations !== true) return;

      const stripe = new Stripe(configuration.stripe.secret_key, {
        apiVersion: "2025-08-27.basil",
      });

      const localBillingPortalConfigurationsRes = await storeDispatchTyped(
        {
          operation: "selectAll",
          table: "stripeBillingPortalConfigurations",
        },
        context,
        configuration
      );
      const localBillingPortalConfigurationsById = new Map(
        (localBillingPortalConfigurationsRes.docs || []).map((p: any) => [
          p.billingPortalConfigurationId,
          p,
        ])
      );

      const billingPortalConfigurations =
        await stripe.billingPortal.configurations
          .list({ limit: 100 })
          .autoPagingToArray({ limit: 10_000 });

      const stripeBillingPortalConfigurationIds = new Set<string>();

      for (const billingPortalConfiguration of billingPortalConfigurations) {
        stripeBillingPortalConfigurationIds.add(billingPortalConfiguration.id);

        await storeDispatchTyped(
          {
            operation: "upsert",
            table: "stripeBillingPortalConfigurations",
            idField: "billingPortalConfigurationId",
            data: {
              billingPortalConfigurationId: billingPortalConfiguration.id,
              stripe: BillingPortalConfigurationStripeToConvex(
                billingPortalConfiguration
              ),
              lastSyncedAt: Date.now(),
            },
          },
          context,
          configuration
        );
      }

      for (const [
        billingPortalConfigurationId,
      ] of localBillingPortalConfigurationsById.entries()) {
        if (
          !stripeBillingPortalConfigurationIds.has(billingPortalConfigurationId)
        ) {
          await storeDispatchTyped(
            {
              operation: "deleteById",
              table: "stripeBillingPortalConfigurations",
              idField: "billingPortalConfigurationId",
              idValue: billingPortalConfigurationId,
            },
            context,
            configuration
          );
        }
      }
    },
  });
