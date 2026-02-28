import deepmerge from "deepmerge";

import {
  GenericActionCtx,
  GenericMutationCtx,
  GenericSchema,
  SchemaDefinition,
} from "convex/server";
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
import {
  metadata,
  nullableboolean,
  nullablenumber,
  nullablestring,
  optionalany,
  optionalnullableobject,
} from "./schema/validators";

export const allStripeTablesExcept = (
  tables: Array<keyof typeof stripeTables>,
) =>
  Object.fromEntries(
    Object.entries(stripeTables).map(([table, definition]) => [
      table,
      !tables.includes(table as keyof typeof stripeTables)
        ? definition
        : undefined,
    ]),
  ) as typeof stripeTables;

export const onlyStripeTables = (tables: Array<keyof typeof stripeTables>) =>
  Object.fromEntries(
    Object.entries(stripeTables).map(([table, definition]) => [
      table,
      tables.includes(table as keyof typeof stripeTables)
        ? definition
        : undefined,
    ]),
  ) as typeof stripeTables;

export const DEFAULT_CONFIGURATION: InternalConfiguration = {
  schema: undefined as unknown as SchemaDefinition<GenericSchema, true>,
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
  webhook: {
    handlers: [],
  },
  detached: false,
  callbacks: {
    afterChange: async () => {},
  },
  sync: {
    tables: {
      stripeAccounts: true,
      stripeBillingPortalConfigurations: true,
      stripeCapabilities: true,
      stripeCharges: true,
      stripeCheckoutSessions: true,
      stripeCoupons: true,
      stripeCreditNotes: true,
      stripeCustomers: true,
      stripeDisputes: true,
      stripeEarlyFraudWarnings: true,
      stripeInvoices: true,
      stripeMandates: true,
      stripePaymentIntents: true,
      stripePaymentMethods: true,
      stripePayouts: true,
      stripePlans: true,
      stripePrices: true,
      stripeProducts: true,
      stripePromotionCodes: true,
      stripeRefunds: true,
      stripeReviews: true,
      stripeSetupIntents: true,
      stripeSubscriptions: true,
      stripeSubscriptionSchedules: true,
      stripeTaxIds: true,
      stripeTransfers: true,
    },
    catalog: {
      products: [],
      prices: [],
      metadataKey: "convex_stripe_key",
      behavior: {
        onExisting: "update",
        onMissingKey: "create",
      },
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
  configuration: InputConfiguration,
): InternalConfiguration => {
  const output = deepmerge(DEFAULT_CONFIGURATION, configuration);
  const stripeTableNames = Object.keys(stripeTables);
  output.sync.tables = Object.fromEntries(
    Object.keys(configuration.schema.tables)
      .filter((table) => stripeTableNames.includes(table))
      .map((table) => [table, true]),
  ) as Record<keyof typeof stripeTables, boolean>;
  return output;
};

export const DEFAULT_OPTIONS: InternalOptions = {
  store: "store",
  debug: false,
  logger: new Logger(false),
  base: "stripe",
};

export const normalizeOptions = (options: InputOptions): InternalOptions => {
  const { logger, ...rest } = options;
  const merged = deepmerge(DEFAULT_OPTIONS, rest);

  return {
    ...merged,
    logger: logger || DEFAULT_OPTIONS.logger,
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

export {
  metadata,
  nullableboolean,
  nullablenumber,
  nullablestring,
  optionalany,
  optionalnullableobject,
};
