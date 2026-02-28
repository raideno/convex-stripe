import { GenericQueryCtx, queryGeneric } from "convex/server";

import { HelperAuthCallback } from "@/convex/types";
import { StripeDataModel } from "@/schema";
import { InternalConfiguration, InternalOptions } from "@/types";

/**
 * Pre-built public Convex query that returns all synced Stripe products,
 * each with their associated prices nested inside.
 *
 * This is a public, unauthenticated-by-default query since product catalogs
 * are typically visible to all users. Your `authenticateAndAuthorize`
 * callback can still gate it if you need it to be private.
 *
 * The `entityId` argument is never required for this operation — the
 * callback is called with `entityId = undefined` to match the contract where
 * no explicit entity is acting.
 *
 * @example
 * // frontend
 * const products = await convex.query(api.stripe.products, {});
 */
export const buildProducts = (
  _configuration: InternalConfiguration,
  _options: InternalOptions,
  authenticateAndAuthorize: HelperAuthCallback,
) =>
  queryGeneric({
    args: {},
    handler: async (context_) => {
      const context = context_ as GenericQueryCtx<StripeDataModel>;

      const [authorized] = await authenticateAndAuthorize({
        context,
        operation: "products",
        entityId: undefined,
      });

      if (!authorized) {
        throw new Error("Unauthorized");
      }

      const prices = await context.db.query("stripePrices").collect();
      const products = await context.db.query("stripeProducts").collect();

      return (products as StripeDataModel["stripeProducts"]["document"][]).map(
        (product) => ({
          ...product,
          prices: (
            prices as StripeDataModel["stripePrices"]["document"][]
          ).filter((price) => price.stripe.productId === product.productId),
        }),
      );
    },
  });
