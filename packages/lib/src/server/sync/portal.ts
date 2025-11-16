import Stripe from "stripe";

import { v } from "convex/values";

import { defineActionImplementation } from "@/helpers";

export const SyncPortalImplementation = defineActionImplementation({
  args: v.object({}),
  name: "syncPortal",
  handler: async (context, args, configuration) => {
    const stripe = new Stripe(configuration.stripe.secret_key, {
      apiVersion: "2025-08-27.basil",
    });

    const configurations = await stripe.billingPortal.configurations
      .list({ limit: 100 })
      .autoPagingToArray({ limit: 10_000 });

    const defaultConfiguration = configurations.find(
      (config) => config.is_default && config.active
    );

    if (defaultConfiguration) {
      console.info(
        "[STRIPE SYNC PORTAL] Default configuration already exists."
      );
      return null;
    }

    const newConfiguration = await stripe.billingPortal.configurations.create({
      business_profile: {
        headline: undefined,
        privacy_policy_url: undefined,
        terms_of_service_url: undefined,
      },
      features: {
        customer_update: {
          enabled: true,
          allowed_updates: ["email", "address", "shipping", "phone", "name"],
        },
        invoice_history: {
          enabled: true,
        },
        payment_method_update: {
          enabled: true,
        },
        subscription_cancel: {
          enabled: true,
          mode: "at_period_end",
          cancellation_reason: {
            enabled: true,
            options: [
              "too_expensive",
              "missing_features",
              "switched_service",
              "unused",
              "customer_service",
              "too_complex",
              "low_quality",
              "other",
            ],
          },
        },
        subscription_update: {
          enabled: false,
          default_allowed_updates: [],
          proration_behavior: "none",
          products: [],
        },
      },
    });

    console.info(
      "[STRIPE SYNC PORTAL](Created) Default billing portal configuration created."
    );

    return newConfiguration.id;
  },
});
