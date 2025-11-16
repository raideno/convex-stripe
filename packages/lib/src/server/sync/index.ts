import { v } from "convex/values";

import { defineActionImplementation } from "@/helpers";

import { SyncDataImplementation } from "./data";
import { SyncPortalImplementation } from "./portal";
import { SyncWebhookImplementation } from "./webhook";

const DEFAULT_SYNC_DATA = true;
const DEFAULT_SYNC_WEBHOOK = true;
const DEFAULT_SYNC_PORTAL = true;

export const SyncImplementation = defineActionImplementation({
  args: v.object({
    data: v.optional(v.boolean()),
    webhook: v.optional(v.boolean()),
    portal: v.optional(v.boolean()),
  }),
  name: "sync",
  handler: async (
    context,
    {
      data: syncData = DEFAULT_SYNC_DATA,
      webhook: syncWebhook = DEFAULT_SYNC_WEBHOOK,
      portal: syncPortal = DEFAULT_SYNC_PORTAL,
    },
    configuration
  ) => {
    const jobs = [];

    if (syncData)
      jobs.push(SyncDataImplementation.handler(context, {}, configuration));
    if (syncWebhook)
      jobs.push(SyncWebhookImplementation.handler(context, {}, configuration));
    if (syncPortal)
      jobs.push(SyncPortalImplementation.handler(context, {}, configuration));

    return await Promise.all(jobs);
  },
});
