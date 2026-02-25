import {
  FieldTypeFromFieldPath,
  GenericMutationCtx,
  IndexTiebreakerField,
} from "convex/server";

import { BY_STRIPE_ID_INDEX_NAME, StripeDataModel } from "../../schema";

type StripeIndexFieldPath<
  TableName extends keyof StripeDataModel,
  IndexName extends keyof StripeDataModel[TableName]["indexes"] & string,
> = Exclude<
  StripeDataModel[TableName]["indexes"][IndexName][number],
  IndexTiebreakerField
>;

export async function deleteById<
  TableName extends keyof StripeDataModel,
  IndexName extends keyof StripeDataModel[TableName]["indexes"] & string,
  IndexField extends StripeIndexFieldPath<TableName, IndexName>,
>(
  context: GenericMutationCtx<StripeDataModel>,
  table: TableName,
  indexName: IndexName,
  idField: IndexField,
  idValue: FieldTypeFromFieldPath<
    StripeDataModel[TableName]["document"],
    IndexField
  >,
): Promise<boolean> {
  const existing = await context.db
    .query(table)
    .withIndex(indexName, (q) => q.eq(idField, idValue))
    .unique();

  if (existing) {
    await context.db.delete(existing._id);
    return true;
  }

  return false;
}
