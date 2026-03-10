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

type IndexValuesFor<
  TableName extends keyof StripeDataModel,
  IndexName extends keyof StripeDataModel[TableName]["indexes"] & string,
> = {
  [K in StripeIndexFieldPath<TableName, IndexName> &
    string]?: FieldTypeFromFieldPath<StripeDataModel[TableName]["document"], K>;
};

export async function upsert<
  TableName extends keyof StripeDataModel,
  IndexName extends keyof StripeDataModel[TableName]["indexes"] & string,
>(
  context: GenericMutationCtx<StripeDataModel>,
  table: TableName,
  indexName: IndexName,
  indexValues: IndexValuesFor<TableName, IndexName>,
  data: WithoutSystemFields<StripeDataModel[TableName]["document"]>,
): Promise<GenericId<TableName>> {
  const existing = await context.db
    .query(table)
    .withIndex(indexName, (q) => {
      let query = q;
      for (const [field, value] of Object.entries(indexValues)) {
        // @ts-ignore - dynamic field access over index fields
        query = query.eq(field, value);
      }
      return query;
    })
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
