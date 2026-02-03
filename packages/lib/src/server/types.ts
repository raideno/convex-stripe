import { GenericMutationCtx } from "convex/server";
import { Infer, Validator } from "convex/values";
import Stripe from "stripe";

import { Logger } from "@/logger";
import { stripeTables } from "@/schema";

import { StoreImplementation } from "./store";

export interface InternalOptions {
  store: string;
  debug: boolean;
  logger: Logger;
  base: string;
}

export interface InternalConfiguration {
  stripe: {
    secret_key: string;
    webhook_secret: string;
  };

  webhook: {
    metadata: Record<string, string>;
    description: string;
    path: string;
  };

  portal: Stripe.BillingPortal.ConfigurationCreateParams;

  callback?: {
    unstable__afterChange?: (
      context: GenericMutationCtx<any>,
      args: InferArgs<(typeof StoreImplementation)["args"]>,
      returned: any,
    ) => Promise<void>;
  };

  detached: boolean;

  sync: Partial<Record<keyof typeof stripeTables, boolean>>;

  redirectTtlMs: number;
}

export type WithOptional<T, K extends keyof T = never> = Omit<T, K> &
  Partial<Pick<T, K>>;

export type InputConfiguration = WithOptional<
  InternalConfiguration,
  "portal" | "sync" | "redirectTtlMs" | "webhook" | "detached"
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
