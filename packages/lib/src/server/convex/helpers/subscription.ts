import { GenericQueryCtx, queryGeneric } from "convex/server";
import { v } from "convex/values";

import { HelperAuthCallback } from "@/convex/types";
import { StripeDataModel } from "@/schema";
import { InternalConfiguration, InternalOptions } from "@/types";

/**
 * Pre-built public Convex query that returns the active Stripe subscription
 * for the authenticated entity, or `null` if they have no subscription.
 *
 * When `entityId` is omitted, `authenticateAndAuthorize` is expected to
 * derive the caller's own identity from `context`.
 *
 * @example
 * // frontend
 * const sub = await convex.query(api.stripe.subscription, {});
 */
export const buildSubscription = (
  _configuration: InternalConfiguration,
  _options: InternalOptions,
  authenticateAndAuthorize: HelperAuthCallback,
) =>
  queryGeneric({
    args: {
      entityId: v.optional(v.string()),
    },
    handler: async (context_, args) => {
      const context = context_ as GenericQueryCtx<StripeDataModel>;

      const [authorized, resolvedEntityId] = await authenticateAndAuthorize({
        context,
        operation: "subscription",
        entityId: args.entityId,
      });

      if (!authorized || !resolvedEntityId) {
        throw new Error("Unauthorized");
      }

      const customer = await context.db
        .query("stripeCustomers")
        .withIndex("byEntityId", (q) => q.eq("entityId", resolvedEntityId))
        .unique();

      if (!customer) return null;

      const subscription = await context.db
        .query("stripeSubscriptions")
        .withIndex("byCustomerId", (q) =>
          q.eq("customerId", customer.customerId),
        )
        .unique();

      return subscription ?? null;
    },
  });
