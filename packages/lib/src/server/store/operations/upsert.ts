import {
  FieldTypeFromFieldPath,
  GenericMutationCtx,
  IndexTiebreakerField,
  WithoutSystemFields,
} from "convex/server";
import { GenericId } from "convex/values";

import { StripeDataModel } from "../../schema";

type StripeIndexFieldPath<
  TableName extends keyof StripeDataModel,
  IndexName extends keyof StripeDataModel[TableName]["indexes"] & string,
> = Exclude<
  StripeDataModel[TableName]["indexes"][IndexName][number],
  IndexTiebreakerField
>;

export async function upsert<
  TableName extends keyof StripeDataModel,
  IndexName extends keyof StripeDataModel[TableName]["indexes"] & string,
  IndexField extends StripeIndexFieldPath<TableName, IndexName>,
>(
  context: GenericMutationCtx<StripeDataModel>,
  table: TableName,
  indexName: IndexName,
  idField: IndexField,
  data: WithoutSystemFields<StripeDataModel[TableName]["document"]> &
    Record<
      IndexField,
      FieldTypeFromFieldPath<StripeDataModel[TableName]["document"], IndexField>
    >,
): Promise<GenericId<TableName>> {
  const existing = await context.db
    .query(table)
    .withIndex(indexName, (q) => q.eq(idField, data[idField]))
    .unique();

  if (existing) {
    await context.db.patch(existing._id, {
      ...data,
      lastSyncedAt: Date.now(),
    });
    return existing._id;
  } else {
    return await context.db.insert(table, {
      ...data,
      lastSyncedAt: Date.now(),
    });
  }
}
