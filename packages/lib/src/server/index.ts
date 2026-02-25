import {
  GenericActionCtx,
  GenericDataModel,
  httpActionGeneric,
  HttpRouter,
  internalActionGeneric,
  internalMutationGeneric,
  RoutableMethod,
} from "convex/server";
import Stripe from "stripe";

import {
  CreateAccountImplementation,
  CreateAccountLinkImplementation,
  CreateCustomerImplementation,
  PayImplementation,
  PortalImplementation,
  SubscribeImplementation,
} from "./actions";
import { normalizeConfiguration, normalizeOptions } from "./helpers";
import { redirectImplementation } from "./redirects";
import { StripeDataModel } from "./schema";
import { StoreImplementation } from "./store";
import { SyncImplementation } from "./sync";
import { webhookImplementation } from "./webhooks";

import type {
  CallbackAfterChange,
  CallbackEvent,
  InputConfiguration,
  InputOptions,
  InternalConfiguration,
  InternalOptions,
} from "./types";

export { stripeTables } from "./schema";

export { Logger } from "./logger";

export {
  CallbackAfterChange,
  CallbackEvent,
  InputConfiguration,
  InputOptions,
  InternalConfiguration,
  InternalOptions,
};

const buildHttp = (
  configuration: InternalConfiguration,
  options: InternalOptions,
) => ({
  webhook: {
    path: "/stripe/webhook",
    method: "POST" as const as RoutableMethod,
    handler: (
      context: GenericActionCtx<GenericDataModel>,
      request: Request,
      stripe?: Stripe,
    ) => {
      return webhookImplementation(
        configuration,
        options,
        context as unknown as GenericActionCtx<StripeDataModel>,
        request,
        stripe,
      );
    },
  },
  redirect: {
    pathPrefix: "/stripe/return/",
    method: "GET" as const as RoutableMethod,
    handler: (
      context: GenericActionCtx<GenericDataModel>,
      request: Request,
    ) => {
      return redirectImplementation(
        configuration,
        options,
        context as unknown as GenericActionCtx<StripeDataModel>,
        request,
      );
    },
  } as const,
});

export const internalConvexStripe = (
  configuration_: InputConfiguration,
  options_?: InputOptions,
) => {
  const ConvexStripeInternalConfiguration =
    normalizeConfiguration(configuration_);
  const ConvexStripeInternalOptions = normalizeOptions(options_ || {});

  const http_ = buildHttp(
    ConvexStripeInternalConfiguration,
    ConvexStripeInternalOptions,
  );

  return {
    stripe: {
      http: http_,
      addHttpRoutes: (http: HttpRouter, config?: InputConfiguration) => {
        config = normalizeConfiguration(config || configuration_);
        http.route({
          path: http_.webhook.path,
          method: http_.webhook.method,
          handler: httpActionGeneric((context, request) => {
            return http_.webhook.handler(context, request);
          }),
        });
        http.route({
          pathPrefix: http_.redirect.pathPrefix,
          method: http_.redirect.method,
          handler: httpActionGeneric((context, request) => {
            return http_.redirect.handler(context, request);
          }),
        });
      },
      portal: (
        context: GenericActionCtx<any>,
        args: Parameters<(typeof PortalImplementation)["handler"]>[1],
        options: Parameters<(typeof PortalImplementation)["handler"]>[2] = {},
      ) =>
        PortalImplementation.handler(
          context as unknown as GenericActionCtx<StripeDataModel>,
          args,
          options,
          ConvexStripeInternalConfiguration,
          ConvexStripeInternalOptions,
        ),
      subscribe: (
        context: GenericActionCtx<any>,
        args: Parameters<(typeof SubscribeImplementation)["handler"]>[1],
        options: Parameters<
          (typeof SubscribeImplementation)["handler"]
        >[2] = {},
      ) =>
        SubscribeImplementation.handler(
          context as unknown as GenericActionCtx<StripeDataModel>,
          args,
          options,
          ConvexStripeInternalConfiguration,
          ConvexStripeInternalOptions,
        ),
      pay: (
        context: GenericActionCtx<any>,
        args: Parameters<(typeof PayImplementation)["handler"]>[1],
        options: Parameters<(typeof PayImplementation)["handler"]>[2] = {},
      ) =>
        PayImplementation.handler(
          context as unknown as GenericActionCtx<StripeDataModel>,
          args,
          options,
          ConvexStripeInternalConfiguration,
          ConvexStripeInternalOptions,
        ),
      customers: {
        create: (
          context: GenericActionCtx<any>,
          args: Parameters<(typeof CreateCustomerImplementation)["handler"]>[1],
          options: Parameters<
            (typeof CreateCustomerImplementation)["handler"]
          >[2] = {},
        ) =>
          CreateCustomerImplementation.handler(
            context as unknown as GenericActionCtx<StripeDataModel>,
            args,
            options,
            ConvexStripeInternalConfiguration,
            ConvexStripeInternalOptions,
          ),
      },
      accounts: {
        create: (
          context: GenericActionCtx<any>,
          args: Parameters<(typeof CreateAccountImplementation)["handler"]>[1],
          options: Parameters<
            (typeof CreateAccountImplementation)["handler"]
          >[2] = {},
        ) =>
          CreateAccountImplementation.handler(
            context as unknown as GenericActionCtx<StripeDataModel>,
            args,
            options,
            ConvexStripeInternalConfiguration,
            ConvexStripeInternalOptions,
          ),
        link: (
          context: GenericActionCtx<any>,
          args: Parameters<
            (typeof CreateAccountLinkImplementation)["handler"]
          >[1],
          options: Parameters<
            (typeof CreateAccountLinkImplementation)["handler"]
          >[2] = {},
        ) => {
          return CreateAccountLinkImplementation.handler(
            context as unknown as GenericActionCtx<StripeDataModel>,
            args,
            options,
            ConvexStripeInternalConfiguration,
            ConvexStripeInternalOptions,
          );
        },
      },
    },
    store: internalMutationGeneric({
      args: StoreImplementation.args,
      handler: async (context, args) =>
        StoreImplementation.handler(
          context,
          args,
          ConvexStripeInternalConfiguration,
          ConvexStripeInternalOptions,
        ),
    }),
    sync: internalActionGeneric({
      args: SyncImplementation.args,
      handler: (context, args) =>
        SyncImplementation.handler(
          context,
          args,
          ConvexStripeInternalConfiguration,
          ConvexStripeInternalOptions,
        ),
    }),
  };
};
