// index.ts
import {
  FieldTypeFromFieldPath,
  GenericActionCtx,
  IndexTiebreakerField,
  WithoutSystemFields,
} from "convex/server";
import { GenericId, v } from "convex/values";

import { defineMutationImplementation } from "@/helpers";
import { BY_STRIPE_ID_INDEX_NAME, StripeDataModel } from "@/schema";

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

type StripeIndexFieldPath<
  TableName extends keyof StripeDataModel,
  IndexName extends keyof StripeDataModel[TableName]["indexes"] & string,
> = Exclude<
  StripeDataModel[TableName]["indexes"][IndexName][number],
  IndexTiebreakerField
>;

export const StoreImplementation = defineMutationImplementation({
  name: "store",
  args: {
    operation: v.string(),
    table: v.string(),
    indexName: v.optional(v.string()),
    idField: v.optional(v.string()),
    data: v.optional(v.any()),
    idValue: v.optional(v.any()),
    field: v.optional(v.string()),
    value: v.optional(v.any()),
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
        if (!args.idField) {
          throw new Error('Missing "idField" for upsert');
        }
        if (args.data == null) {
          throw new Error('Missing "data" for upsert');
        }

        const upsertIndexName =
          args.indexName as keyof StripeDataModel[typeof table]["indexes"] &
            string;
        const upsertIdField = args.idField as StripeIndexFieldPath<
          typeof table,
          typeof upsertIndexName
        >;

        const upsertData = args.data as WithoutSystemFields<
          StripeDataModel[typeof table]["document"]
        > &
          Record<
            typeof upsertIdField,
            FieldTypeFromFieldPath<
              StripeDataModel[typeof table]["document"],
              typeof upsertIdField
            >
          >;
        const id = await upsert(
          context,
          table,
          upsertIndexName,
          upsertIdField,
          upsertData,
        );
        if (configuration.callbacks && configuration.callbacks.afterChange)
          try {
            await configuration.callbacks.afterChange(
              context,
              "upsert",
              // TODO: remove any
              { table: table as any },
            );
          } catch (error) {
            console.error("[afterChange]:", error);
          }
        return { id };
      }

      case "insert": {
        if (args.data == null) {
          throw new Error('Missing "data" for insert');
        }
        const insertData = args.data as WithoutSystemFields<
          StripeDataModel[typeof table]["document"]
        >;
        const id = await insert(context, table, insertData);
        if (configuration.callbacks && configuration.callbacks.afterChange)
          try {
            await configuration.callbacks.afterChange(
              context,
              "insert",
              // TODO: remove any
              { table: table as any },
            );
          } catch (error) {
            console.error("[afterChange]:", error);
          }
        return { id };
      }

      case "deleteById": {
        if (!args.indexName) {
          throw new Error('Missing "indexName" for deleteById');
        }
        if (!args.idField) {
          throw new Error('Missing "idField" for deleteById');
        }
        if (typeof args.idValue === "undefined") {
          throw new Error('Missing "idValue" for deleteById');
        }

        const deleteByIdIndexName =
          args.indexName as keyof StripeDataModel[typeof table]["indexes"] &
            string;
        const deleteByIdIdField = args.idField as StripeIndexFieldPath<
          typeof table,
          typeof deleteByIdIndexName
        >;
        const deleteByIdIdValue = args.idValue as FieldTypeFromFieldPath<
          StripeDataModel[typeof table]["document"],
          typeof deleteByIdIdField
        >;

        const deleted = await deleteById(
          context,
          table,
          deleteByIdIndexName,
          deleteByIdIdField,
          deleteByIdIdValue,
        );
        if (configuration.callbacks && configuration.callbacks.afterChange)
          try {
            await configuration.callbacks.afterChange(
              context,
              "delete",
              // TODO: remove any
              { table: table as any },
            );
          } catch (error) {
            console.error("[afterChange]:", error);
          }
        return { deleted };
      }

      case "selectOne": {
        if (!args.indexName) {
          throw new Error('Missing "indexName" for selectOne');
        }
        if (!args.field) {
          throw new Error('Missing "field" for selectOne');
        }
        if (typeof args.value === "undefined") {
          throw new Error('Missing "value" for selectOne');
        }
        const selectOneIndexName =
          args.indexName as keyof StripeDataModel[typeof table]["indexes"] &
            string;
        const selectOneField = args.field as StripeIndexFieldPath<
          typeof table,
          typeof selectOneIndexName
        >;
        const selectOneValue = args.value as FieldTypeFromFieldPath<
          StripeDataModel[typeof table]["document"],
          typeof selectOneField
        >;
        const doc = await selectOne(
          context,
          table,
          selectOneIndexName,
          selectOneField,
          selectOneValue,
        );
        return { doc };
      }

      case "selectById": {
        if (args.id == null) {
          throw new Error('Missing "id" for selectById');
        }
        const doc = await selectById(context, table, args.id as GenericId<any>);
        return { doc };
      }

      case "selectAll": {
        const docs = await selectAll(context, table);
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
