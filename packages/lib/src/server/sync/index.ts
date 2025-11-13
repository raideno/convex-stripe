import { v } from "convex/values";

import { defineActionImplementation } from "@/helpers";

import { SyncDataImplementation } from "./data";
import { SyncWebhookImplementation } from "./webhook";

const DEFAULT_SYNC_DATA = true;
const DEFAULT_SYNC_WEBHOOK = true;

export const SyncImplementation = defineActionImplementation({
  args: v.object({
    data: v.optional(v.boolean()),
    webhook: v.optional(v.boolean()),
  }),
  name: "sync",
  handler: async (
    context,
    {
      data: syncData = DEFAULT_SYNC_DATA,
      webhook: syncWebhook = DEFAULT_SYNC_WEBHOOK,
    },
    configuration
  ) => {
    const jobs = [];

    if (syncData)
      jobs.push(SyncDataImplementation.handler(context, {}, configuration));
    if (syncWebhook)
      jobs.push(SyncWebhookImplementation.handler(context, {}, configuration));

    return await Promise.all(jobs);
  },
});
