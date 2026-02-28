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
import type { HelperAuthCallback, StripeHelpersConfig, SubscribeUrls, PayUrls, PortalUrls } from "./convex";
import { buildHelpers } from "./convex";
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

import type { RedirectHandler } from "./redirects/types";

export { defineRedirectHandler } from "./redirects/types";

export { defineWebhookHandler } from "./webhooks/types";

export { RedirectHandler };

export { buildSignedReturnUrl, REDIRECT_HANDLERS } from "./redirects/index";
export { SYNC_HANDLERS } from "./sync/tables";
export { WEBHOOK_HANDLERS } from "./webhooks/index";

export { allStripeTablesExcept, onlyStripeTables } from "./helpers";

export { stripeTables } from "./schema";

export { Logger } from "./logger";

export { HelperAuthCallback, StripeHelpersConfig, SubscribeUrls, PayUrls, PortalUrls };

export {
  CallbackAfterChange,
  CallbackEvent,
  InputConfiguration,
  InputOptions,
  InternalConfiguration,
  InternalOptions,
};

/**
 * Builds the HTTP handler descriptors for the webhook and redirect routes.
 * These are later registered on the Convex `HttpRouter` via `addHttpRoutes`.
 */
const buildHttp = (
  configuration: InternalConfiguration,
  options: InternalOptions,
) => ({
  webhook: {
    // TODO: should be using the url from the stripe webhook
    path: "/stripe/webhook",
    method: "POST" as const as RoutableMethod,
    handler: (
      context: GenericActionCtx<GenericDataModel>,
      request: Request,
      stripe?: Stripe,
    ) => {
      const url = new URL(request.url);

      const connect = url.searchParams.get("connect") === "true";

      return webhookImplementation(
        configuration,
        options,
        context as unknown as GenericActionCtx<StripeDataModel>,
        request,
        connect,
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

/**
 * Initializes the Convex Stripe integration.
 *
 * Returns a set of utilities to wire up HTTP routes, trigger Stripe actions,
 * and keep your Convex database in sync with Stripe events.
 *
 * @param configuration_ - Your Stripe and sync configuration.
 * @param options_ - Optional internal options (logger, debug mode, etc.).
 *
 * @example
 * export const { stripe, store, sync } = internalConvexStripe({
 *   stripe: {
 *     secret_key: process.env.STRIPE_SECRET_KEY!,
 *     account_webhook_secret: process.env.STRIPE_WHSEC!,
 *   },
 *   sync: {
 *     tables: { customers: true, subscriptions: true },
 *   },
 * });
 */
export const internalConvexStripe = (
  configuration_: InputConfiguration & { sync?: { tables?: never } },
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
      /** Raw HTTP handler descriptors. Prefer `addHttpRoutes` unless you need manual control. */
      http: http_,

      /** A pre-configured Stripe SDK client using your `secret_key` and `version`. */
      client: new Stripe(ConvexStripeInternalConfiguration.stripe.secret_key, {
        apiVersion: ConvexStripeInternalConfiguration.stripe.version,
      }),

      /**
       * Registers the Stripe webhook and redirect routes on your Convex `HttpRouter`.
       * Call this inside your `convex/http.ts` file.
       *
       * - `POST /stripe/webhook`  receives and verifies Stripe webhook events.
       * - `GET  /stripe/return/*`  handles post-payment/portal redirect flows.
       *
       * @param http - Your Convex `HttpRouter` instance.
       * @param config - Optional config override (defaults to the root configuration).
       *
       * @example
       * // convex/http.ts
       * import { httpRouter } from "convex/server";
       * import { stripe } from "./stripe";
       *
       * const http = httpRouter();
       * stripe.addHttpRoutes(http);
       * export default http;
       */
      addHttpRoutes: (http: HttpRouter) => {
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

      /**
       * Opens a Stripe Billing Portal session for an existing customer.
       * Use this to let users manage their subscription, invoices, and payment methods.
       *
       * @param context - The Convex action context.
       * @param args - Customer identifier and return URL.
       * @param options - Optional overrides (e.g. portal configuration ID).
       */
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

      /**
       * Creates a Stripe Checkout session in `subscription` mode.
       * Redirects the user to Stripe Checkout to set up a recurring subscription.
       *
       * @param context - The Convex action context.
       * @param args - Price ID, customer info, and success/cancel URLs.
       * @param options - Optional overrides for the Checkout session.
       */
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

      /**
       * Creates a Stripe Checkout session in `payment` mode (one-time payment).
       *
       * @param context - The Convex action context.
       * @param args - Price ID, quantity, and success/cancel URLs.
       * @param options - Optional overrides for the Checkout session.
       */
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
        /**
         * Creates a new Stripe Customer and stores it in your Convex database.
         *
         * @param context - The Convex action context.
         * @param args - Customer details (email, name, metadata, etc.).
         * @param options - Optional overrides for the customer creation.
         */
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
        /**
         * Creates a new Stripe Connect account (Express or Custom).
         * Use this to onboard sellers, platforms, or service providers.
         *
         * @param context - The Convex action context.
         * @param args - Account type, email, and capabilities.
         * @param options - Optional overrides for the account creation.
         */
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

        /**
         * Creates a Stripe Connect Account Link for onboarding.
         * Redirects the connected account holder to Stripe's hosted onboarding flow.
         *
         * @param context - The Convex action context.
         * @param args - Account ID, refresh URL, and return URL.
         * @param options - Optional overrides for the account link.
         */
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

      /**
       * Returns a set of pre-built, authorization-aware Convex functions
       * (actions and queries) that cover the most common Stripe operations.
       *
       * Each returned function calls your `authenticateAndAuthorize` callback
       * to resolve the caller's identity and enforce access control before
       * delegating to the underlying Stripe implementation.
       *
       * When a caller omits `entityId`, it signals that they want to act on
       * themselves — your callback is responsible for deriving their identity
       * from `context` (e.g. via `getAuthUserId`).
       *
       * **Returned functions:**
       * - `internalCreateCustomer` — internal action: create a Stripe customer for a given entity.
       * - `subscribe`             — public action:   create a subscription checkout session.
       * - `pay`                   — public action:   create a one-time payment checkout session.
       * - `products`              — public query:    list all products with their prices.
       * - `subscription`          — public query:    get the entity's active subscription.
       * - `customer`              — public query:    get the entity's Stripe customer record.
       * - `portal`                — public action:   open a Billing Portal session.
       *
       * @param config - Configuration for the helpers.
       * @param config.authenticateAndAuthorize - Callback that authenticates the
       *   caller and returns `[isAuthorized, entityId | null]`.
       * @param config.urls - Centralized return URL configuration (required). URLs are grouped
       *   by operation: `subscribe`, `pay`, and `portal`.
       *
       * @example
       * // convex/stripe.ts
       * import { getAuthUserId } from "@convex-dev/auth/server";
       *
       * export const { stripe, store, sync } = internalConvexStripe({ ... });
       *
       * export const { internalCreateCustomer, subscribe, pay, products, subscription, customer, portal } =
       *   stripe.helpers({
       *     authenticateAndAuthorize: async ({ context, operation, entityId }) => {
       *       const userId = await getAuthUserId(context);
       *       if (!userId) return [false, null];
       *       // If caller passed an explicit entityId, use it; otherwise act on themselves.
       *       return [true, entityId ?? userId];
       *     },
       *     urls: {
       *       subscribe: {
       *         success: "https://example.com/success",
       *         cancel: "https://example.com/cancel",
       *         failure: "https://example.com/error",
       *       },
       *       pay: {
       *         success: "https://example.com/pay-success",
       *         cancel: "https://example.com/pay-cancel",
       *         failure: "https://example.com/pay-error",
       *       },
       *       portal: {
       *         return: "https://example.com/account",
       *         failure: "https://example.com/portal-error",
       *       },
       *     },
       *   });
       */
      helpers: (config: StripeHelpersConfig) =>
        buildHelpers(
          ConvexStripeInternalConfiguration,
          ConvexStripeInternalOptions,
          config,
        ),
    },

    /**
     * Internal Convex mutation that persists a Stripe object into your database.
     * Typically called from within the webhook handler  not meant for direct use.
     */
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

    /**
     * Internal Convex action that syncs Stripe catalog data (products, prices,
     * webhooks, portal config) into Stripe based on your `sync` configuration.
     * Run this manually or on deploy to keep Stripe in sync with your config.
     */
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
