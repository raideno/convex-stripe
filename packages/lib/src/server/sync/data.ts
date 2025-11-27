import { v } from "convex/values";

import { defineActionImplementation } from "@/helpers";

const HANDLERS_MODULES = Object.values(
  import.meta.glob("./handlers/*.handler.ts", {
    eager: true,
  })
) as unknown as Array<
  Record<string, ReturnType<typeof defineActionImplementation>>
>;

if (HANDLERS_MODULES.some((handler) => Object.keys(handler).length > 1))
  throw new Error(
    "Each sync handler file should only have one export / default export"
  );

export const SYNC_HANDLERS = HANDLERS_MODULES.map(
  (exports) => Object.values(exports)[0]
);

if (
  SYNC_HANDLERS.some(
    (handler) => !["handler", "name"].every((key) => key in handler)
  )
)
  throw new Error(
    "Each sync handler file should export a valid implementation"
  );

export const SyncDataImplementation = defineActionImplementation({
  args: v.object({}),
  name: "sync",
  handler: async (context, args, configuration, options) => {
    await Promise.all(
      SYNC_HANDLERS.map(async (handler) => {
        try {
          await handler.handler(context, {}, configuration, options);
          console.info(`[STRIPE SYNC ${handler.name}](Success)`);
        } catch (error) {
          options.logger.error(
            `[STRIPE SYNC ${handler.name}](Error): ${error}`
          );
        }
      })
    );
  },
});
