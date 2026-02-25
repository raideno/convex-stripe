import { v } from "convex/values";

import { defineActionImplementation } from "@/helpers";

import { SyncAccountWebhookImplementation } from "@/sync/account-webhook";
import { SyncConnectWebhookImplementation } from "@/sync/connect-webhook";
import { SyncDataImplementation } from "@/sync/data";
import { SyncPlansAndPricesImplementation } from "@/sync/plans-and-prices";
import { SyncPortalImplementation } from "@/sync/portal";

const DEFAULT_SYNC_DATA = true;
const DEFAULT_SYNC_ACCOUNT_WEBHOOK = false;
const DEFAULT_SYNC_CONNECT_WEBHOOK = false;
const DEFAULT_SYNC_PORTAL = false;
const DEFAULT_SYNC_CATALOG = false;

export const SyncImplementation = defineActionImplementation({
  args: v.object({
    data: v.optional(v.boolean()),
    accountWebhook: v.optional(v.boolean()),
    connectWebhook: v.optional(v.boolean()),
    portal: v.optional(v.boolean()),
    unstable_catalog: v.optional(v.boolean()),
  }),
  name: "sync",
  handler: async (
    context,
    {
      data: syncData = DEFAULT_SYNC_DATA,
      accountWebhook: syncAccountWebhook = DEFAULT_SYNC_ACCOUNT_WEBHOOK,
      connectWebhook: syncConnectWebhook = DEFAULT_SYNC_CONNECT_WEBHOOK,
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
      if (syncAccountWebhook)
        await SyncAccountWebhookImplementation.handler(
          context,
          {},
          configuration,
          options,
        );
    } catch (error) {
      console.error("Failed to sync webhook:", error);
    }
    try {
      if (syncConnectWebhook)
        await SyncConnectWebhookImplementation.handler(
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
