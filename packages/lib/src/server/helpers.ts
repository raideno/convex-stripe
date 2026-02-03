import { GenericActionCtx, GenericMutationCtx } from "convex/server";
import { Infer, v, VObject } from "convex/values";

import { Logger } from "@/logger";
import { StripeDataModel } from "@/schema";
import {
  ArgSchema,
  InferArgs,
  InputConfiguration,
  InputOptions,
  InternalConfiguration,
  InternalOptions,
} from "@/types";

export const DEFAULT_PATH = "/stripe/webhook";
export const DEFAULT_DESCRIPTION = "Convex Stripe Webhook Endpoint";
export const DEFAULT_METADATA = {};
export const DEFAULT_DETACHED = false;

export const normalizeConfiguration = (
  config: InputConfiguration,
): InternalConfiguration => {
  return {
    ...config,
    redirectTtlMs: 15 * 60 * 1000,
    detached: DEFAULT_DETACHED,
    sync: {
      stripeCoupons: true,
      stripeCustomers: true,
      stripePrices: true,
      stripeProducts: true,
      stripePromotionCodes: true,
      stripeSubscriptions: true,
      stripePayouts: true,
      stripeCheckoutSessions: true,
      stripePaymentIntents: true,
      stripeRefunds: true,
      stripeInvoices: true,
      stripeReviews: true,
      stripeCharges: true,
      stripeCreditNotes: true,
      stripeDisputes: true,
      stripeEarlyFraudWarnings: true,
      stripePaymentMethods: true,
      stripePlans: true,
      stripeSetupIntents: true,
      stripeSubscriptionSchedules: true,
      stripeTaxIds: true,
      stripeMandates: true,
      stripeBillingPortalConfigurations: true,
    },
    webhook: {
      path: config.webhook?.path || DEFAULT_PATH,
      description: config.webhook?.description || DEFAULT_DESCRIPTION,
      metadata: config.webhook?.metadata || DEFAULT_METADATA,
    },
    portal: config.portal || {
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
    },
  };
};

export const normalizeOptions = (
  options: Partial<InputOptions>,
): InternalOptions => {
  return {
    ...options,
    store: options.store || "store",
    debug: options.debug || false,
    logger: options.logger || new Logger(options.debug || false),
    base: options.base || "stripe",
  };
};

export const defineActionCallableFunction = <
  const S extends object,
  const O extends object,
  R,
>(spec: {
  name: string;
  handler: (
    context: GenericActionCtx<StripeDataModel>,
    args: S,
    stripeOptions: O,
    configuration: InternalConfiguration,
    options: InternalOptions,
  ) => R;
}) => spec;

export const defineActionImplementation = <
  S extends VObject<any, any>,
  R,
>(spec: {
  args: S;
  name: string;
  handler: (
    context: GenericActionCtx<StripeDataModel>,
    args: Infer<S>,
    configuration: InternalConfiguration,
    options: InternalOptions,
  ) => R;
}) => spec;

export const defineMutationImplementation = <S extends ArgSchema, R>(spec: {
  args: S;
  name: string;
  handler: (
    context: GenericMutationCtx<StripeDataModel>,
    args: InferArgs<S>,
    configuration: InternalConfiguration,
    options: InternalOptions,
  ) => R;
}) => spec;

export const nullablestring = () => v.union(v.string(), v.null());
export const nullableboolean = () => v.union(v.boolean(), v.null());
export const nullablenumber = () => v.union(v.number(), v.null());
export const metadata = () =>
  v.record(v.string(), v.union(v.string(), v.number(), v.null()));
export const optionalnullableobject = <T extends ArgSchema>(object: T) =>
  v.optional(v.union(v.object(object), v.null()));
export const optionalany = () => v.optional(v.any());
