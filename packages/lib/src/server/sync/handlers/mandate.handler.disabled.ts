import { v } from "convex/values";

import { defineActionImplementation } from "@/helpers";

export const MandatesSyncImplementation = defineActionImplementation({
  args: v.object({}),
  name: "mandates",
  handler: async (context, args, configuration, options) => {
    if (configuration.sync.stripeMandates !== true) return;

    options.logger.log("No .list method for mandates in Stripe API");
  },
});
