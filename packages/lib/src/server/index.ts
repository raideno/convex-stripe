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
  PayImplementation,
  PortalImplementation,
  SetupImplementation,
  SubscribeImplementation,
} from "./actions";
import { normalizeConfiguration } from "./helpers";
import { redirectImplementation } from "./redirects";
import { StripeDataModel } from "./schema";
import { StoreImplementation } from "./store";
import { SyncAllImplementation } from "./sync/all";
import type { InputConfiguration, InternalConfiguration } from "./types";
import { webhookImplementation } from "./webhooks";

export { stripeTables } from "./schema";

export { Logger } from "./logger";

export { InputConfiguration };

const buildHttp = (configuration: InternalConfiguration) => ({
  webhook: {
    path: "/stripe/webhook",
    method: "POST" as const as RoutableMethod,
    handler: (
      context: GenericActionCtx<GenericDataModel>,
      request: Request,
      stripe?: Stripe
    ) => {
      return webhookImplementation(
        configuration,
        context as unknown as GenericActionCtx<StripeDataModel>,
        request,
        stripe
      );
    },
  },
  redirect: {
    pathPrefix: "/stripe/return/",
    method: "GET" as const as RoutableMethod,
    handler: (
      context: GenericActionCtx<GenericDataModel>,
      request: Request
    ) => {
      return redirectImplementation(
        configuration,
        context as unknown as GenericActionCtx<StripeDataModel>,
        request
      );
    },
  } as const,
});

export const internalConvexStripe = (configuration_: InputConfiguration) => {
  const configuration = normalizeConfiguration(configuration_);
  const http_ = buildHttp(configuration);

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
        options: Parameters<(typeof PortalImplementation)["handler"]>[2] = {}
      ) =>
        PortalImplementation.handler(
          context as unknown as GenericActionCtx<StripeDataModel>,
          args,
          options,
          configuration
        ),
      subscribe: (
        context: GenericActionCtx<any>,
        args: Parameters<(typeof SubscribeImplementation)["handler"]>[1],
        options: Parameters<(typeof SubscribeImplementation)["handler"]>[2] = {}
      ) =>
        SubscribeImplementation.handler(
          context as unknown as GenericActionCtx<StripeDataModel>,
          args,
          options,
          configuration
        ),
      pay: (
        context: GenericActionCtx<any>,
        args: Parameters<(typeof PayImplementation)["handler"]>[1],
        options: Parameters<(typeof PayImplementation)["handler"]>[2] = {}
      ) =>
        PayImplementation.handler(
          context as unknown as GenericActionCtx<StripeDataModel>,
          args,
          options,
          configuration
        ),
    },
    store: internalMutationGeneric({
      args: StoreImplementation.args,
      handler: async (context, args) =>
        StoreImplementation.handler(context, args, configuration),
    }),
    sync: internalActionGeneric({
      args: SyncAllImplementation.args,
      handler: (context, args) =>
        SyncAllImplementation.handler(context, args, configuration),
    }),
    setup: internalActionGeneric({
      args: SetupImplementation.args,
      handler: (context, args) =>
        SetupImplementation.handler(context, args, configuration),
    }),
  };
};
