import deepmerge from "deepmerge";

import { GenericActionCtx, GenericMutationCtx } from "convex/server";
import { Infer, v, VObject } from "convex/values";

import { Logger } from "@/logger";
import { StripeDataModel, stripeTables } from "@/schema";
import {
  ArgSchema,
  InferArgs,
  InputConfiguration,
  InputOptions,
  InternalConfiguration,
  InternalOptions,
} from "@/types";

export const syncAllTables = () =>
  Object.fromEntries(
    Object.keys(stripeTables).map((table) => [table, true]),
  ) as Record<keyof typeof stripeTables, boolean>;

export const syncAllTablesExcept = (tables: Array<keyof typeof stripeTables>) =>
  Object.fromEntries(
    Object.keys(stripeTables).map((table) => [
      table,
      !tables.includes(table as keyof typeof stripeTables),
    ]),
  ) as Record<keyof typeof stripeTables, boolean>;

export const syncOnlyTables = (tables: Array<keyof typeof stripeTables>) =>
  Object.fromEntries(
    Object.keys(stripeTables).map((table) => [
      table,
      tables.includes(table as keyof typeof stripeTables),
    ]),
  ) as Record<keyof typeof stripeTables, boolean>;

export const DEFAULT_CONFIGURATION: InternalConfiguration = {
  stripe: {
    version: "2025-08-27.basil",
    secret_key: "",
    account_webhook_secret: "",
    connect_webhook_secret: "",
  },
  redirect: {
    ttlMs: 15 * 60 * 1000,
    handlers: [],
  },
  detached: false,
  callbacks: {
    afterChange: async () => {},
  },
  sync: {
    catalog: {
      products: [],
      prices: [],
      metadataKey: "convex_stripe_key",
      behavior: {
        onExisting: "update",
        onMissingKey: "create",
      },
    },
    tables: {
      stripeAccounts: true,
      stripeCapabilities: true,
      stripeTransfers: true,
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
    webhooks: {
      account: {
        path: "/stripe/webhook",
        description: "Convex Stripe Webhook Endpoint",
        metadata: {},
      },
      connect: {
        path: "/stripe/webhook?connect=true",
        description: "Convex Stripe Webhook Endpoint",
        metadata: {},
      },
    },
    portal: {
      metadata: {},
      login_page: {
        enabled: true,
      },
      default_return_url: "https://example.com/account",
      expand: ["business_profile"],
      name: "Customer Portal",
      business_profile: {
        headline: "",
        privacy_policy_url: "",
        terms_of_service_url: "",
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
          proration_behavior: "none",
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
          schedule_at_period_end: {
            conditions: [],
          },
          default_allowed_updates: [],
          proration_behavior: "none",
          products: [],
        },
      },
    },
  },
};

export const normalizeConfiguration = (
  config: InputConfiguration,
): InternalConfiguration => {
  return deepmerge(DEFAULT_CONFIGURATION, config as InternalConfiguration);
};

export const DEFAULT_OPTIONS: InternalOptions = {
  store: "store",
  debug: false,
  logger: new Logger(false),
  base: "stripe",
};

export const normalizeOptions = (options: InputOptions): InternalOptions => {
  return deepmerge(DEFAULT_OPTIONS, options);
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
