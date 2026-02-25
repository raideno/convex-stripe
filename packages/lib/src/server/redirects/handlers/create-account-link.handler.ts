import { v } from "convex/values";

import { defineRedirectHandler } from "@/redirects/types";

export const PayReturnImplementation = defineRedirectHandler({
  origins: ["create-account-link-return", "create-account-link-refresh"],
  data: {
    accountId: v.string(),
  },
  handle: async (origin, context, data, configuration, options) => {
    // TODO: sync a specific account
  },
});
