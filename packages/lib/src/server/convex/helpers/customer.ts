import { GenericQueryCtx, queryGeneric } from "convex/server";
import { v } from "convex/values";

import { HelperAuthCallback } from "@/convex/types";
import { StripeDataModel } from "@/schema";
import { InternalConfiguration, InternalOptions } from "@/types";

/**
 * Pre-built public Convex query that returns the Stripe customer record
 * for the authenticated entity, or `null` if they have no customer yet.
 *
 * When `entityId` is omitted, `authenticateAndAuthorize` is expected to
 * derive the caller's own identity from `context`.
 *
 * @example
 * // frontend
 * const customer = await convex.query(api.stripe.customer, {});
 */
export const buildCustomer = (
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
        operation: "customer",
        entityId: args.entityId,
      });

      if (!authorized || !resolvedEntityId) {
        throw new Error("Unauthorized");
      }

      const customer = await context.db
        .query("stripeCustomers")
        .withIndex("byEntityId", (q) => q.eq("entityId", resolvedEntityId))
        .unique();

      return customer ?? null;
    },
  });
