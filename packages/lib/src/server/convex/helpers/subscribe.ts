import { actionGeneric, GenericActionCtx } from "convex/server";
import { v } from "convex/values";

import { SubscribeImplementation } from "@/actions";
import { InternalConfiguration, InternalOptions } from "@/types";

import { StripeDataModel } from "@/schema";
import { HelperAuthCallback, StripeHelpersConfig, UrlResolver } from "../types";

/**
 * Pre-built public Convex action that creates a Stripe Checkout session
 * in `subscription` mode for the authenticated entity.
 *
 * When `entityId` is omitted, `authenticateAndAuthorize` is expected to
 * derive the caller's own identity from `context` (e.g. via `getAuthUserId`).
 *
 * @example
 * // convex/stripe.ts
 * export const { subscribe } = helpers({ ... });
 *
 * // frontend
 * const { url } = await convex.action(api.stripe.subscribe, {
 *   priceId: "price_xxx",
 * });
 */
export const buildSubscribe = (
  configuration: InternalConfiguration,
  options: InternalOptions,
  authenticateAndAuthorize: HelperAuthCallback,
  urls: StripeHelpersConfig["urls"],
) =>
  actionGeneric({
    args: {
      entityId: v.optional(v.string()),
      priceId: v.string(),
    },
    handler: async (context_, args) => {
      const context = context_ as GenericActionCtx<StripeDataModel>;

      const [authorized, resolvedEntityId] = await authenticateAndAuthorize({
        context,
        operation: "subscribe",
        entityId: args.entityId,
      });

      if (!authorized || !resolvedEntityId) {
        throw new Error("Unauthorized");
      }

      const resolve = async (resolver: UrlResolver<{ priceId: string }>) => {
        if (typeof resolver === "string") return resolver;
        return await resolver({
          context,
          entityId: resolvedEntityId,
          args: { priceId: args.priceId },
        });
      };

      const success_url = await resolve(urls.subscribe.success);
      const cancel_url = await resolve(urls.subscribe.cancel);
      const failure_url = await resolve(urls.subscribe.failure);

      const session = await SubscribeImplementation.handler(
        context,
        {
          entityId: resolvedEntityId,
          priceId: args.priceId,
          mode: "subscription",
          success_url,
          cancel_url,
          failure_url,
        },
        {},
        configuration,
        options,
      );

      return { url: session.url };
    },
  });
