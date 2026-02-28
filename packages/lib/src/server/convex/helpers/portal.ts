import { actionGeneric, GenericActionCtx } from "convex/server";
import { v } from "convex/values";

import { PortalImplementation } from "@/actions";
import {
  HelperAuthCallback,
  StripeHelpersConfig,
  UrlResolver,
} from "@/convex/types";
import { StripeDataModel } from "@/schema";
import { InternalConfiguration, InternalOptions } from "@/types";

/**
 * Pre-built public Convex action that opens a Stripe Billing Portal session
 * for the authenticated entity.
 *
 * When `entityId` is omitted, `authenticateAndAuthorize` is expected to
 * derive the caller's own identity from `context` (e.g. via `getAuthUserId`).
 *
 * The Billing Portal lets the entity manage their subscription, view invoices,
 * and update payment methods without any additional code on your end.
 *
 * @example
 * // convex/stripe.ts
 * export const { portal } = helpers({ ... });
 *
 * // frontend
 * const { url } = await convex.action(api.stripe.portal, {});
 */
export const buildPortal = (
  configuration: InternalConfiguration,
  options: InternalOptions,
  authenticateAndAuthorize: HelperAuthCallback,
  urls: StripeHelpersConfig["urls"],
) =>
  actionGeneric({
    args: {
      entityId: v.optional(v.string()),
    },
    handler: async (context_, args) => {
      const context = context_ as GenericActionCtx<StripeDataModel>;

      const [authorized, resolvedEntityId] = await authenticateAndAuthorize({
        context,
        operation: "portal",
        entityId: args.entityId,
      });

      if (!authorized || !resolvedEntityId) {
        throw new Error("Unauthorized");
      }

      const resolve = async (resolver: UrlResolver<{}>) => {
        if (typeof resolver === "string") return resolver;
        return await resolver({
          context,
          entityId: resolvedEntityId,
          args: {},
        });
      };

      const return_url = await resolve(urls.portal.return);
      const failure_url = await resolve(urls.portal.failure);

      const session = await PortalImplementation.handler(
        context,
        {
          entityId: resolvedEntityId,
          return_url,
          failure_url,
        },
        {},
        configuration,
        options,
      );

      return { url: session.url };
    },
  });
