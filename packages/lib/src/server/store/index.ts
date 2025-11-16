import { anyApi, GenericActionCtx } from "convex/server";
import { GenericId, v } from "convex/values";

import { defineMutationImplementation } from "@/helpers";
import { StripeDataModel, stripeTables } from "@/schema";

import { InternalConfiguration } from "../types";
import { StoreDispatchArgs, StoreResultFor } from "./types";

import {
  deleteById,
  selectAll,
  selectById,
  selectOne,
  upsert,
} from "./operations";

export const StoreImplementation = defineMutationImplementation({
  name: "store",
  args: {
    operation: v.string(),
    table: v.string(),
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
      "deleteById",
      "selectOne",
      "selectById",
      "selectAll",
    ]);
    if (!allowed.has(args.operation)) {
      throw new Error(`Unknown op "${args.operation}"`);
    }

    const table = args.table as keyof StripeDataModel;

    let returned:
      | { id: GenericId<any> }
      | { deleted: boolean }
      | { doc: any | null }
      | { docs: any[] }
      | undefined;

    switch (args.operation) {
      case "upsert": {
        if (!args.idField) {
          throw new Error('Missing "idField" for upsert');
        }
        if (args.data == null) {
          throw new Error('Missing "data" for upsert');
        }
        const id = await upsert(
          context,
          table,
          args.idField as any,
          args.data as any
        );
        returned = { id };
        if (
          configuration.callback &&
          configuration.callback.unstable__afterChange
        )
          await configuration.callback.unstable__afterChange(
            context,
            args,
            returned
          );
        return { id };
      }

      case "deleteById": {
        if (!args.idField) {
          throw new Error('Missing "idField" for deleteById');
        }
        if (typeof args.idValue === "undefined") {
          throw new Error('Missing "idValue" for deleteById');
        }
        const deleted = await deleteById(
          context,
          table,
          args.idField as any,
          args.idValue as any
        );
        returned = { deleted };
        if (
          configuration.callback &&
          configuration.callback.unstable__afterChange
        )
          await configuration.callback.unstable__afterChange(
            context,
            args,
            returned
          );
        return { deleted };
      }

      case "selectOne": {
        if (!args.field) {
          throw new Error('Missing "field" for selectOne');
        }
        if (typeof args.value === "undefined") {
          throw new Error('Missing "value" for selectOne');
        }
        const doc = await selectOne(
          context,
          table,
          args.field as any,
          args.value as any
        );
        returned = { doc };
        if (
          configuration.callback &&
          configuration.callback.unstable__afterChange
        )
          await configuration.callback.unstable__afterChange(
            context,
            args,
            returned
          );
        return { doc };
      }

      case "selectById": {
        if (args.id == null) {
          throw new Error('Missing "id" for selectById');
        }
        const doc = await selectById(context, table, args.id as GenericId<any>);
        returned = { doc };
        if (
          configuration.callback &&
          configuration.callback.unstable__afterChange
        )
          await configuration.callback.unstable__afterChange(
            context,
            args,
            returned
          );
        return { doc };
      }

      case "selectAll": {
        const docs = await selectAll(context, table);
        returned = { docs };
        if (
          configuration.callback &&
          configuration.callback.unstable__afterChange
        )
          await configuration.callback.unstable__afterChange(
            context,
            args,
            returned
          );
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
  configuration: InternalConfiguration
): Promise<StoreResultFor<StripeDataModel, A>> {
  return (await context.runMutation(
    `${configuration.base}:${configuration.store}` as any,
    args
  )) as StoreResultFor<StripeDataModel, A>;
}
