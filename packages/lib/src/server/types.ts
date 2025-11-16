import { Infer, v, Validator } from "convex/values";

import { Logger } from "@/logger";
import { stripeTables } from "@/schema";
import { AnyDataModel, GenericMutationCtx } from "convex/server";
import { StoreImplementation } from "./store";

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

  callback?: {
    unstable__afterChange?: (
      context: GenericMutationCtx<any>,
      args: InferArgs<(typeof StoreImplementation)["args"]>,
      returned: any
    ) => Promise<void>;
  };

  store: string;

  redirectTtlMs: number;

  sync: Partial<Record<keyof typeof stripeTables, boolean>>;

  debug: boolean;

  logger: Logger;

  base: string;
}

export type WithOptional<T, K extends keyof T = never> = Omit<T, K> &
  Partial<Pick<T, K>>;

export type InputConfiguration = WithOptional<
  InternalConfiguration,
  "base" | "store" | "debug" | "logger" | "sync" | "redirectTtlMs" | "webhook"
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
