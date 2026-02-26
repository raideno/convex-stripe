import Stripe from "stripe";

import { v } from "convex/values";

import { defineActionImplementation } from "@/helpers";

export const SyncPortalImplementation = defineActionImplementation({
  args: v.object({
    accountId: v.optional(v.string()),
  }),
  name: "syncPortal",
  handler: async (context, args, configuration) => {
    const stripe = new Stripe(configuration.stripe.secret_key, {
      apiVersion: configuration.stripe.version,
    });

    const configurations = await stripe.billingPortal.configurations
      .list({ limit: 100 })
      .autoPagingToArray({ limit: 10_000 });

    const defaultConfiguration = configurations.find(
      (config) => config.is_default && config.active,
    );

    if (defaultConfiguration) {
      console.info(
        "[STRIPE SYNC PORTAL] Default configuration already exists.",
      );
      return;
    }

    await stripe.billingPortal.configurations.create(configuration.sync.portal);

    console.info(
      "[STRIPE SYNC PORTAL](Created) Default billing portal configuration created.",
    );
  },
});
