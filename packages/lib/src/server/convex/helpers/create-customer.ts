import { GenericActionCtx, internalActionGeneric } from "convex/server";
import { v } from "convex/values";

import { CreateCustomerImplementation } from "@/actions";
import { HelperAuthCallback } from "@/convex/types";
import { InternalConfiguration, InternalOptions } from "@/types";
import { StripeDataModel } from "@/schema";

/**
 * Pre-built internal Convex action that creates a Stripe customer for a
 * given `entityId`.
 *
 * Designed to be called from auth callbacks (e.g. `afterUserCreatedOrUpdated`)
 * where you already know the entity ID. The `authenticateAndAuthorize`
 * callback is invoked with the supplied `entityId` so you can apply any
 * additional authorization logic you need.
 *
 * @example
 * // convex/stripe.ts
 * export const { stripe, store, sync, helpers } = internalConvexStripe({ ... });
 * export const { createCustomer } = helpers({ authenticateAndAuthorize });
 *
 * // convex/auth.ts
 * callbacks: {
 *   afterUserCreatedOrUpdated: async (context, args) => {
 *     await context.scheduler.runAfter(0, internal.stripe.createCustomer, {
 *       entityId: args.userId,
 *       email: args.profile.email,
 *     });
 *   },
 * }
 */
export const buildCreateCustomer = (
  configuration: InternalConfiguration,
  options: InternalOptions,
  authenticateAndAuthorize: HelperAuthCallback,
) =>
  internalActionGeneric({
    args: {
      entityId: v.string(),
      email: v.optional(v.string()),
    },
    handler: async (context_, args) => {
      const context = context_ as GenericActionCtx<StripeDataModel>;

      const [authorized, resolvedEntityId] = await authenticateAndAuthorize({
        context,
        operation: "createCustomer",
        entityId: args.entityId,
      });

      if (!authorized || !resolvedEntityId) {
        throw new Error("Unauthorized");
      }

      return CreateCustomerImplementation.handler(
        context,
        { entityId: resolvedEntityId, email: args.email },
        {},
        configuration,
        options,
      );
    },
  });
