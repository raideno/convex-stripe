import { GenericMutationCtx } from "convex/server";
import { Infer, Validator } from "convex/values";
import Stripe from "stripe";

import { Logger } from "@/logger";
import { StripeDataModel, stripeTables } from "@/schema";

export interface InternalOptions {
  store: string;
  debug: boolean;
  logger: Logger;
  base: string;
}

export type CallbackEvent = {
  [K in keyof StripeDataModel]: {
    table: K;
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
    version?: Stripe.StripeConfig["apiVersion"];
    secret_key: string;
    account_webhook_secret: string;
    connect_webhook_secret?: string;
  };

  sync: {
    catalog?: {
      products?: Stripe.ProductCreateParams[];
      prices?: Stripe.PriceCreateParams[];
      behavior?: {
        onExisting?: "update" | "archive_and_recreate" | "skip" | "error";
        onMissingKey?: "create" | "error";
      };
      metadataKey?: string;
    };
    webhooks?: {
      account: {
        metadata?: Record<string, string>;
        description?: string;
        path?: string;
      };
      connect: {
        metadata?: Record<string, string>;
        description?: string;
        path?: string;
      };
    };
    portal?: Stripe.BillingPortal.ConfigurationCreateParams;
    tables: Record<keyof typeof stripeTables, boolean>;
  };

  callbacks?: {
    afterChange?: CallbackAfterChange;
  };

  detached?: boolean;

  redirectTtlMs?: number;
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
