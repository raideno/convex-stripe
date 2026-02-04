import { v } from "convex/values";

import { storeDispatchTyped } from "@/store";

import { SubscriptionSyncImplementation } from "../../sync/handlers/subscription";
import { defineRedirectHandler } from "../types";

export const PayReturnImplementation = defineRedirectHandler({
  origins: ["pay-cancel", "pay-success", "pay-return"],
  data: {
    entityId: v.string(),
    customerId: v.string(),
    referenceId: v.string(),
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
        { customerId },
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
