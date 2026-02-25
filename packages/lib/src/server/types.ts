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
    // TODO: put them back when StoreImplementation is mature enough
    // NOTE: only before is passed when deleting, only after is passed when inserting, both are passed when updating
    // before?: DocumentByName<StripeDataModel, K>;
    // after?: DocumentByName<StripeDataModel, K>;
  };
}[keyof StripeDataModel];

export type CallbackAfterChange = (
  context: GenericMutationCtx<any>,
  operation: "upsert" | "delete" | "insert",
  event: CallbackEvent,
) => Promise<void>;

export interface InternalConfiguration {
  stripe: {
    secret_key: string;
    webhook_secret: string;
  };

  catalog: {
    products: Stripe.ProductCreateParams[];
    prices: Stripe.PriceCreateParams[];
    behavior: {
      onExisting: "update" | "archive_and_recreate" | "skip" | "error";
      onMissingKey: "create" | "error";
    };
    metadataKey: string;
  };

  webhook: {
    metadata: Record<string, string>;
    description: string;
    path: string;
  };

  portal: Stripe.BillingPortal.ConfigurationCreateParams;

  callback?: {
    unstable__afterChange?: CallbackAfterChange;
  };

  detached: boolean;

  sync: Partial<Record<keyof typeof stripeTables, boolean>>;

  redirectTtlMs: number;
}

export type WithOptional<T, K extends keyof T = never> = Omit<T, K> &
  Partial<Pick<T, K>>;

export type InputConfiguration = WithOptional<
  InternalConfiguration,
  "portal" | "sync" | "redirectTtlMs" | "webhook" | "detached" | "catalog"
>;

export type InputOptions = WithOptional<
  InternalOptions,
  "store" | "debug" | "logger" | "base"
>;

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
