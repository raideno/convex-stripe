import { GenericMutationCtx, IdField } from "convex/server";
import { Infer, Validator } from "convex/values";
import Stripe from "stripe";

import { Logger } from "@/logger";
import { defineRedirectHandler } from "@/redirects/types";
import { StripeDataModel, stripeTables } from "@/schema";
import { defineWebhookHandler } from "./webhooks/types";

export interface InternalOptions {
  store: string;
  debug: boolean;
  logger: Logger;
  base: string;
}

export type CallbackEvent = {
  [K in keyof StripeDataModel]: {
    table: K;
    _id: StripeDataModel[K]["document"]["_id"];
  };
}[keyof StripeDataModel];

export type CallbackAfterChange = (
  context: GenericMutationCtx<any>,
  operation: "upsert" | "delete" | "insert",
  event: CallbackEvent,
) => Promise<void>;

export type RecursiveDeepRequired<T> = T extends (...args: any[]) => any
  ? T
  : T extends object
    ? { [K in keyof T]-?: RecursiveDeepRequired<T[K]> }
    : T;

export interface InputConfiguration {
  stripe: {
    /** Stripe API version to pin against (recommended for stability). */
    version?: Stripe.StripeConfig["apiVersion"];

    /** Secret key for your Stripe account (starts with `sk_`). */
    secret_key: string;

    /** Webhook signing secret for account-level webhooks (starts with `whsec_`). */
    account_webhook_secret: string;

    /**
     * Webhook signing secret for Stripe Connect webhooks (if you use Connect).
     * If omitted, Connect webhooks are treated as disabled/unverified.
     */
    connect_webhook_secret?: string;
  };

  sync: {
    catalog?: {
      /** Products to ensure exist in Stripe (optional bootstrap). */
      products?: Stripe.ProductCreateParams[];

      /** Prices to ensure exist in Stripe (optional bootstrap). */
      prices?: Stripe.PriceCreateParams[];

      behavior?: {
        /**
         * What to do if a product/price already exists in Stripe.
         * - update: update fields
         * - archive_and_recreate: archive and create a new object
         * - skip: leave as-is
         * - error: throw
         */
        onExisting?: "update" | "archive_and_recreate" | "skip" | "error";

        /**
         * What to do if the "metadata key" is missing on an object.
         * - create: create it
         * - error: throw
         */
        onMissingKey?: "create" | "error";
      };

      /**
       * Metadata field used to match local definitions to Stripe objects.
       * Example: "app_internal_key"
       */
      metadataKey?: string;
    };

    webhooks?: {
      account: {
        /** Metadata applied when creating/updating the Stripe webhook endpoint. */
        metadata?: Record<string, string>;
        /** Description used for the Stripe webhook endpoint. */
        description?: string;
        /** Override the default path (otherwise your code uses `/stripe/webhook`). */
        path?: string;
      };
      connect: {
        metadata?: Record<string, string>;
        description?: string;
        path?: string;
      };
    };

    /** Optional Billing Portal configuration to create/sync. */
    portal?: Stripe.BillingPortal.ConfigurationCreateParams;

    /** Which Stripe tables you want to sync into Convex. */
    tables: Record<keyof typeof stripeTables, boolean>;
  };

  callbacks?: {
    /** Called after a row is inserted/upserted/deleted in your Stripe tables. */
    afterChange?: CallbackAfterChange;
  };

  /**
   * If true, avoids attaching routes/state globally (depends on your library meaning).
   * Document your intended behavior here.
   */
  detached?: boolean;

  webhook?: {
    /** Optional additional webhook handlers to handle custom Stripe events or override default behavior. */
    handlers?: Array<ReturnType<typeof defineWebhookHandler>>;
  };

  redirect?: {
    /** TTL for redirect state (ms). */
    ttlMs?: number;

    /** Additional handlers for redirect-based flows (e.g. Checkout, OAuth). */
    handlers?: Array<ReturnType<typeof defineRedirectHandler>>;
  };
}

export type InternalConfiguration = RecursiveDeepRequired<InputConfiguration>;

export type InputOptions = Partial<InternalOptions>;

export type ArgSchema = Record<
  string,
  Validator<any, "optional" | "required", any>
>;

export type InferArgs<S extends ArgSchema> = {
  [K in keyof S as S[K] extends Validator<any, "required", any>
    ? K
    : never]: Infer<S[K]>;
} & {
  [K in keyof S as S[K] extends Validator<any, "optional", any>
    ? K
    : never]?: Infer<S[K]>;
};
