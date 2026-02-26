import { v } from "convex/values";

import { defineActionImplementation } from "@/helpers";
import Stripe from "stripe";

const HANDLERS_MODULES = Object.values(
  import.meta.glob("./handlers/*.handler.ts", {
    eager: true,
  }),
) as unknown as Array<
  Record<string, ReturnType<typeof defineActionImplementation>>
>;

if (HANDLERS_MODULES.some((handler) => Object.keys(handler).length > 1))
  throw new Error(
    "Each sync handler file should only have one export / default export",
  );

export const SYNC_HANDLERS = HANDLERS_MODULES.map(
  (exports) => Object.values(exports)[0],
);

if (
  SYNC_HANDLERS.some(
    (handler) => !["handler", "name"].every((key) => key in handler),
  )
)
  throw new Error(
    "Each sync handler file should export a valid implementation",
  );

export const SyncTablesImplementation = defineActionImplementation({
  args: v.object({
    withConnect: v.optional(v.boolean()),
  }),
  name: "syncTables",
  handler: async (context, args, configuration, options) => {
    if (!args.withConnect) {
      await Promise.all(
        SYNC_HANDLERS.map(async (handler) => {
          try {
            await handler.handler(
              context,
              {
                accountId: undefined,
              },
              configuration,
              options,
            );
            console.info(`[STRIPE SYNC ${handler.name}](Success)`);
          } catch (error) {
            options.logger.error(
              `[STRIPE SYNC ${handler.name}](Error): ${error}`,
            );
          }
        }),
      );
    } else {
      const stripe = new Stripe(configuration.stripe.secret_key, {
        apiVersion: configuration.stripe.version,
      });

      const accounts = await stripe.accounts
        .list({ limit: 100 })
        .autoPagingToArray({ limit: 10_000 });

      const accountIds = [undefined, ...accounts.map((account) => account.id)];

      await Promise.all(
        accountIds.map(async (accountId) => {
          await Promise.all(
            SYNC_HANDLERS.map(async (handler) => {
              try {
                await handler.handler(
                  context,
                  {
                    accountId: accountId,
                  },
                  configuration,
                  options,
                );
                console.info(
                  `[STRIPE SYNC ${handler.name} for account ${accountId}](Success)`,
                );
              } catch (error) {
                options.logger.error(
                  `[STRIPE SYNC ${handler.name} for account ${accountId}](Error): ${error}`,
                );
              }
            }),
          );
        }),
      );
    }
  },
});
