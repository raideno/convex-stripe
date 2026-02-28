import { actionGeneric, GenericActionCtx } from "convex/server";
import { v } from "convex/values";

import { PayImplementation } from "@/actions";
import {
  HelperAuthCallback,
  StripeHelpersConfig,
  UrlResolver,
} from "@/convex/types";
import { StripeDataModel } from "@/schema";
import { InternalConfiguration, InternalOptions } from "@/types";

/**
 * Pre-built public Convex action that creates a Stripe Checkout session
 * in `payment` mode (one-time payment) for the authenticated entity.
 *
 * When `entityId` is omitted, `authenticateAndAuthorize` is expected to
 * derive the caller's own identity from `context` (e.g. via `getAuthUserId`).
 *
 * @example
 * // convex/stripe.ts
 * export const { pay } = helpers({ ... });
 *
 * // frontend
 * const { url } = await convex.action(api.stripe.pay, {
 *   line_items: [{ price: "price_xxx", quantity: 1 }],
 * });
 */
export const buildPay = (
  configuration: InternalConfiguration,
  options: InternalOptions,
  authenticateAndAuthorize: HelperAuthCallback,
  urls: StripeHelpersConfig["urls"],
) =>
  actionGeneric({
    args: {
      entityId: v.optional(v.string()),
      referenceId: v.string(), // e.g. an order ID
      line_items: v.array(
        v.object({
          price: v.string(),
          quantity: v.number(),
        }),
      ),
    },
    handler: async (context_, args) => {
      const context = context_ as GenericActionCtx<StripeDataModel>;

      const [authorized, resolvedEntityId] = await authenticateAndAuthorize({
        context,
        operation: "pay",
        entityId: args.entityId,
      });

      if (!authorized || !resolvedEntityId) {
        throw new Error("Unauthorized");
      }

      const resolve = async (
        resolver: UrlResolver<{
          referenceId: string;
          line_items: Array<{ price: string; quantity: number }>;
        }>,
      ) => {
        if (typeof resolver === "string") return resolver;
        return await resolver({
          context,
          entityId: resolvedEntityId,
          args: { referenceId: args.referenceId, line_items: args.line_items },
        });
      };

      const success_url = await resolve(urls.pay.success);
      const cancel_url = await resolve(urls.pay.cancel);
      const failure_url = await resolve(urls.pay.failure);

      const session = await PayImplementation.handler(
        context,
        {
          entityId: resolvedEntityId,
          referenceId: args.referenceId,
          mode: "payment",
          line_items: args.line_items,
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
