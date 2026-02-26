import { v } from "convex/values";

import { defineActionImplementation } from "@/helpers";

import { SyncCatalogImplementation } from "@/sync/catalog";
import { SyncTablesImplementation } from "@/sync/tables";
import { SyncPortalImplementation } from "@/sync/portal";
import { SyncAccountWebhookImplementation } from "@/sync/webhooks/account";
import { SyncConnectWebhookImplementation } from "@/sync/webhooks/connect";

export const SyncImplementation = defineActionImplementation({
  args: v.object({
    tables: v.union(
      v.boolean(),
      v.object({ withConnect: v.optional(v.boolean()) }),
    ),
    webhooks: v.optional(
      v.object({
        account: v.optional(v.boolean()),
        connect: v.optional(v.boolean()),
      }),
    ),
    portal: v.optional(v.boolean()),
    unstable_catalog: v.optional(v.boolean()),
  }),
  name: "sync",
  handler: async (
    context,
    {
      tables,
      webhooks,
      // TODO: enable catalog and portal setup for accounts as well, except if enabling it on root enables it on sub accounts too
      portal,
      unstable_catalog,
    },
    configuration,
    options,
  ) => {
    const tasks: Array<[boolean, () => Promise<void>, string]> = [
      [
        Boolean(unstable_catalog),
        () =>
          SyncCatalogImplementation.handler(
            context,
            {},
            configuration,
            options,
          ),
        "catalog",
      ],
      [
        Boolean(tables),
        () =>
          SyncTablesImplementation.handler(
            context,
            {
              withConnect: typeof tables === "object" && tables.withConnect,
            },
            configuration,
            options,
          ),
        "tables",
      ],
      [
        Boolean(webhooks?.account),
        () =>
          SyncAccountWebhookImplementation.handler(
            context,
            {},
            configuration,
            options,
          ),
        "account webhook",
      ],
      [
        Boolean(webhooks?.connect),
        () =>
          SyncConnectWebhookImplementation.handler(
            context,
            {},
            configuration,
            options,
          ),
        "connect webhook",
      ],
      [
        Boolean(portal),
        () =>
          SyncPortalImplementation.handler(context, {}, configuration, options),
        "portal",
      ],
    ];

    for (const [enabled, run, name] of tasks) {
      if (!enabled) continue;
      try {
        await run();
      } catch (error) {
        console.error(`[sync]: failed ${name}:`, error);
      }
    }
  },
});
