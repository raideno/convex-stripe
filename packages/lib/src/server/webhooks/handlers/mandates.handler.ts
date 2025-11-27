import { MandateStripeToConvex } from "@/schema/models/mandate";
import { storeDispatchTyped } from "@/store";

import { defineWebhookHandler } from "../types";

export default defineWebhookHandler({
  events: ["mandate.updated"],
  handle: async (event, context, configuration, options) => {
    if (configuration.sync.stripeMandates !== true) return;

    const mandate = event.data.object;

    switch (event.type) {
      case "mandate.updated":
        await storeDispatchTyped(
          {
            operation: "upsert",
            table: "stripeMandates",
            idField: "mandateId",
            data: {
              mandateId: mandate.id,
              stripe: MandateStripeToConvex(mandate),
              lastSyncedAt: Date.now(),
            },
          },
          context,
          configuration,
          options
        );
        break;
    }
  },
});
