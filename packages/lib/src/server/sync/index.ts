import { v } from "convex/values";

import { defineActionImplementation } from "@/helpers";

import { SyncDataImplementation } from "./data";
import { SyncPortalImplementation } from "./portal";
import { SyncPlansAndPricesImplementation } from "./plans-and-prices";
import { SyncWebhookImplementation } from "./webhook";

const DEFAULT_SYNC_DATA = true;
const DEFAULT_SYNC_WEBHOOK = false;
const DEFAULT_SYNC_PORTAL = false;
const DEFAULT_SYNC_CATALOG = false;

export const SyncImplementation = defineActionImplementation({
  args: v.object({
    data: v.optional(v.boolean()),
    webhook: v.optional(v.boolean()),
    portal: v.optional(v.boolean()),
    unstable_catalog: v.optional(v.boolean()),
  }),
  name: "sync",
  handler: async (
    context,
    {
      data: syncData = DEFAULT_SYNC_DATA,
      webhook: syncWebhook = DEFAULT_SYNC_WEBHOOK,
      portal: syncPortal = DEFAULT_SYNC_PORTAL,
      unstable_catalog: syncCatalog = DEFAULT_SYNC_CATALOG,
    },
    configuration,
    options,
  ) => {
    try {
      if (syncCatalog)
        await SyncPlansAndPricesImplementation.handler(
          context,
          {},
          configuration,
          options,
        );
    } catch (error) {
      console.error("Failed to sync catalog:", error);
    }
    try {
      if (syncData)
        await SyncDataImplementation.handler(
          context,
          {},
          configuration,
          options,
        );
    } catch (error) {
      console.error("Failed to sync data:", error);
    }
    try {
      if (syncWebhook)
        await SyncWebhookImplementation.handler(
          context,
          {},
          configuration,
          options,
        );
    } catch (error) {
      console.error("Failed to sync webhook:", error);
    }
    try {
      if (syncPortal)
        await SyncPortalImplementation.handler(
          context,
          {},
          configuration,
          options,
        );
    } catch (error) {
      console.error("Failed to sync portal:", error);
    }
  },
});
