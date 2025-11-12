import { v } from "convex/values";

import { defineActionImplementation } from "@/helpers";

export const MandatesSyncImplementation = defineActionImplementation({
  args: v.object({}),
  name: "mandates",
  handler: async (context, args, configuration) => {
    if (configuration.sync.stripeMandates !== true) return;

    configuration.logger.log("No .list method for mandates in Stripe API");
  },
});
