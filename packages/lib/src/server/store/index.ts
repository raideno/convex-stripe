import { GenericActionCtx, WithoutSystemFields } from "convex/server";
import { GenericId, v } from "convex/values";

import { defineMutationImplementation } from "@/helpers";
import { StripeDataModel } from "@/schema";

import { InternalConfiguration, InternalOptions } from "../types";
import { StoreDispatchArgs, StoreResultFor } from "./types";

import {
  deleteById,
  insert,
  selectAll,
  selectById,
  selectOne,
  upsert,
} from "./operations";

async function wrapStoreOperation<T>(
  promise: Promise<T>,
  table: string,
): Promise<T> {
  try {
    return await promise;
  } catch (error: unknown) {
    if (
      error instanceof Error &&
      (error.message.includes("Table") || error.message.includes("table")) &&
      error.message.includes("not found")
    ) {
      throw new Error(
        `\n\n[Convex Stripe Error] Table "${table}" was not found in your Convex schema.\n\n` +
          `This happens when your 'sync.tables' configuration in 'convex/stripe.ts' includes a table that is not present in your 'convex/schema.ts'.\n\n` +
          `Please ensure that the arrays passed to 'syncOnlyTables'/'syncAllTablesExcept' match the arrays passed to 'onlyStripeTables'/'allStripeTablesExcept' exactly.\n\n` +
          `Original Error: ${error.message}\n`,
      );
    }
    throw error;
  }
}

export const StoreImplementation = defineMutationImplementation({
  name: "store",
  args: {
    operation: v.string(),
    table: v.string(),
    indexName: v.optional(v.string()),
    indexValues: v.optional(v.any()),
    data: v.optional(v.any()),
    id: v.optional(v.any()),
  },
  handler: async (context, args, configuration) => {
    const allowed = new Set([
      "upsert",
      "insert",
      "deleteById",
      "selectOne",
      "selectById",
      "selectAll",
    ]);
    if (!allowed.has(args.operation)) {
      throw new Error(`Unknown op "${args.operation}"`);
    }

    const table = args.table as keyof StripeDataModel;

    switch (args.operation) {
      case "upsert": {
        if (!args.indexName) {
          throw new Error('Missing "indexName" for upsert');
        }
        if (!args.indexValues || typeof args.indexValues !== "object") {
          throw new Error('Missing "indexValues" for upsert');
        }
        if (args.data == null) {
          throw new Error('Missing "data" for upsert');
        }

        const upsertIndexName =
          args.indexName as keyof StripeDataModel[typeof table]["indexes"] &
            string;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const upsertIndexValues = args.indexValues as any;
        const upsertData = args.data as WithoutSystemFields<
          StripeDataModel[typeof table]["document"]
        >;

        const _id = await wrapStoreOperation(
          upsert(
            context,
            table,
            upsertIndexName,
            upsertIndexValues,
            upsertData,
          ),
          table,
        );
        if (configuration.callbacks && configuration.callbacks.afterChange)
          try {
            await configuration.callbacks.afterChange(
              context,
              "upsert",
              // TODO: remove any
              { table: table as any, _id: _id as any },
            );
          } catch (error) {
            console.error("[afterChange]:", error);
          }
        return { _id };
      }

      case "insert": {
        if (args.data == null) {
          throw new Error('Missing "data" for insert');
        }
        const insertData = args.data as WithoutSystemFields<
          StripeDataModel[typeof table]["document"]
        >;
        const _id = await wrapStoreOperation(
          insert(context, table, insertData),
          table,
        );
        if (configuration.callbacks && configuration.callbacks.afterChange)
          try {
            await configuration.callbacks.afterChange(
              context,
              "insert",
              // TODO: remove any
              { table: table as any, _id: _id as any },
            );
          } catch (error) {
            console.error("[afterChange]:", error);
          }
        return { _id };
      }

      case "deleteById": {
        if (!args.indexName) {
          throw new Error('Missing "indexName" for deleteById');
        }
        if (!args.indexValues || typeof args.indexValues !== "object") {
          throw new Error('Missing "indexValues" for deleteById');
        }

        const deleteByIdIndexName =
          args.indexName as keyof StripeDataModel[typeof table]["indexes"] &
            string;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const deleteByIdIndexValues = args.indexValues as any;

        const _id = await wrapStoreOperation(
          deleteById(
            context,
            table,
            deleteByIdIndexName,
            deleteByIdIndexValues,
          ),
          table,
        );
        if (configuration.callbacks && configuration.callbacks.afterChange)
          try {
            await configuration.callbacks.afterChange(
              context,
              "delete",
              // TODO: remove any
              { table: table as any, _id: _id as any },
            );
          } catch (error) {
            console.error("[afterChange]:", error);
          }
        return { _id };
      }

      case "selectOne": {
        if (!args.indexName) {
          throw new Error('Missing "indexName" for selectOne');
        }
        if (!args.indexValues || typeof args.indexValues !== "object") {
          throw new Error('Missing "indexValues" for selectOne');
        }

        const selectOneIndexName =
          args.indexName as keyof StripeDataModel[typeof table]["indexes"] &
            string;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const selectOneIndexValues = args.indexValues as any;

        const doc = await wrapStoreOperation(
          selectOne(context, table, selectOneIndexName, selectOneIndexValues),
          table,
        );
        return { doc };
      }

      case "selectById": {
        if (args.id == null) {
          throw new Error('Missing "id" for selectById');
        }
        const doc = await wrapStoreOperation(
          selectById(context, table, args.id as GenericId<any>),
          table,
        );
        return { doc };
      }

      case "selectAll": {
        const docs = await wrapStoreOperation(selectAll(context, table), table);
        return { docs };
      }
    }
  },
});

export async function storeDispatchTyped<
  A extends StoreDispatchArgs<StripeDataModel>,
>(
  args: A,
  context: GenericActionCtx<StripeDataModel>,
  configuration: InternalConfiguration,
  options: InternalOptions,
): Promise<StoreResultFor<StripeDataModel, A>> {
  return (await context.runMutation(
    `${options.base}:${options.store}` as any,
    args,
  )) as StoreResultFor<StripeDataModel, A>;
}
