import { Infer, v, VObject } from "convex/values";
import Stripe from "stripe";

import { metadata, nullablenumber, nullablestring } from "@/helpers";

export const BillingPortalConfigurationStripeToConvex = (
  configuration: Stripe.BillingPortal.Configuration
) => {
  const object: Infer<typeof BillingPortalConfigurationObject> = {
    id: configuration.id,
    object: configuration.object,
    active: configuration.active.toString(),
    application:
      typeof configuration.application === "string"
        ? configuration.application
        : null,
    business_profile: {
      headline: configuration.business_profile.headline,
      privacy_policy_url: configuration.business_profile.privacy_policy_url,
      terms_of_service_url: configuration.business_profile.terms_of_service_url,
    },
    created: configuration.created,
    default_return_url: configuration.default_return_url,
    features: {
      customer_update: {
        allowed_updated: configuration.features.customer_update.allowed_updates,
        enabled: configuration.features.customer_update.enabled,
      },
      invoice_history: {
        enabled: configuration.features.invoice_history.enabled,
      },
      payment_method_update: {
        enabled: configuration.features.payment_method_update.enabled,
        // payment_method_configuration:
        //   configuration.features.payment_method_update.enabled,
      },
      subscription_cancel: {
        cancellation_reason: {
          enabled:
            configuration.features.subscription_cancel.cancellation_reason
              .enabled,
          options:
            configuration.features.subscription_cancel.cancellation_reason
              .options,
        },
        enabled: configuration.features.subscription_cancel.enabled,
        mode: configuration.features.subscription_cancel.mode,
        proration_behavior:
          configuration.features.subscription_cancel.proration_behavior,
      },
      subscription_update: {
        default_allowed_updates:
          configuration.features.subscription_update.default_allowed_updates,
        enabled: configuration.features.subscription_update.enabled,
        products: configuration.features.subscription_update.products,
        proration_behavior:
          configuration.features.subscription_update.proration_behavior,
        schedule_at_period_end: {
          conditions:
            configuration.features.subscription_update.schedule_at_period_end
              .conditions,
        },
        // trial_updated_behavior:
        //   configuration.features.subscription_update.trial_updated_behavior,
      },
    },
    is_default: configuration.is_default,
    livemode: configuration.livemode,
    login_page: {
      enabled: configuration.login_page.enabled,
      url: configuration.login_page.url,
    },
    metadata: configuration.metadata,
    name: configuration.name,
    updated: configuration.updated,
  };
  return object;
};

export const BillingPortalConfigurationSchema = {
  id: v.string(),
  object: v.string(),
  active: v.string(),
  application: v.union(v.null(), v.string()),
  business_profile: v.object({
    headline: nullablestring(),
    privacy_policy_url: nullablestring(),
    terms_of_service_url: nullablestring(),
  }),
  created: v.number(),
  default_return_url: nullablestring(),
  features: v.object({
    customer_update: v.object({
      allowed_updated: v.array(
        v.union(
          v.literal("address"),
          v.literal("email"),
          v.literal("name"),
          v.literal("phone"),
          v.literal("shipping"),
          v.literal("tax_id")
        )
      ),
      enabled: v.boolean(),
    }),
    invoice_history: v.object({
      enabled: v.boolean(),
    }),
    payment_method_update: v.object({
      enabled: v.boolean(),
      // payment_method_configuration: nullablestring(),
    }),
    subscription_cancel: v.object({
      cancellation_reason: v.object({
        enabled: v.boolean(),
        options: v.array(
          v.union(
            v.literal("customer_service"),
            v.literal("low_quality"),
            v.literal("missing_features"),
            v.literal("other"),
            v.literal("switched_service"),
            v.literal("too_complex"),
            v.literal("too_expensive"),
            v.literal("unused")
          )
        ),
      }),
      enabled: v.boolean(),
      mode: v.union(v.literal("at_period_end"), v.literal("immediately")),
      proration_behavior: v.union(
        v.literal("always_invoice"),
        v.literal("create_prorations"),
        v.literal("none")
      ),
    }),
    subscription_update: v.object({
      default_allowed_updates: v.array(
        v.union(
          v.literal("price"),
          v.literal("promotion_code"),
          v.literal("quantity")
        )
      ),
      enabled: v.boolean(),
      products: v.optional(
        v.union(
          v.null(),
          v.array(
            v.object({
              adjustable_quantity: v.object({
                enabled: v.boolean(),
                maximum: nullablenumber(),
                minimum: nullablenumber(),
              }),
              prices: v.array(v.string()),
              product: v.string(),
            })
          )
        )
      ),
      proration_behavior: v.union(
        v.literal("always_invoice"),
        v.literal("create_prorations"),
        v.literal("none")
      ),
      schedule_at_period_end: v.object({
        conditions: v.array(
          v.object({
            type: v.union(
              v.literal("decreasing_item_amount"),
              v.literal("shortening_interval")
            ),
          })
        ),
      }),
      // trial_updated_behavior: v.union(
      //   v.literal("continue_trial"),
      //   v.literal("end_trial")
      // ),
    }),
  }),
  is_default: v.boolean(),
  livemode: v.boolean(),
  login_page: v.object({
    enabled: v.boolean(),
    url: nullablestring(),
  }),
  metadata: v.union(v.null(), metadata()),
  name: nullablestring(),
  updated: v.number(),
};

export const BillingPortalConfigurationObject = v.object(
  BillingPortalConfigurationSchema
);
