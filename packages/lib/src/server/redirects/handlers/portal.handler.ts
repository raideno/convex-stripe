import { v } from "convex/values";

import { storeDispatchTyped } from "@/store";

import { SubscriptionSyncImplementation } from "@/sync/helpers/subscription-sync";
import { defineRedirectHandler } from "@/redirects/types";

export const PortalReturnImplementation = defineRedirectHandler({
  origins: ["portal-return"],
  data: {
    accountId: v.optional(v.string()),
    entityId: v.string(),
  },
  handle: async (origin, context, data, configuration, options) => {
    const customer = await storeDispatchTyped(
      {
        operation: "selectOne",
        table: "stripeCustomers",
        indexName: "byEntityId",
        field: "entityId",
        value: data.entityId,
      },
      context,
      configuration,
      options,
    );

    const customerId = customer?.doc?.customerId || null;

    if (customerId) {
      await SubscriptionSyncImplementation.handler(
        context,
        { customerId: customerId, accountId: data.accountId },
        configuration,
        options,
      );
    } else {
      options.logger.warn(
        "Potential redirect abuse detected. No customerId associated with provided entityId " +
          data.entityId,
      );
    }
  },
});
