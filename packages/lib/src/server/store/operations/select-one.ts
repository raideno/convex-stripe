import {
  FieldTypeFromFieldPath,
  GenericMutationCtx,
  IndexTiebreakerField,
} from "convex/server";

import { StripeDataModel } from "../../schema";

type StripeIndexFieldPath<
  TableName extends keyof StripeDataModel,
  IndexName extends keyof StripeDataModel[TableName]["indexes"] & string,
> = Exclude<
  StripeDataModel[TableName]["indexes"][IndexName][number],
  IndexTiebreakerField
>;

export async function selectOne<
  TableName extends keyof StripeDataModel,
  IndexName extends keyof StripeDataModel[TableName]["indexes"] & string,
  Field extends StripeIndexFieldPath<TableName, IndexName>,
>(
  context: GenericMutationCtx<StripeDataModel>,
  table: TableName,
  indexName: IndexName,
  field: Field,
  value: FieldTypeFromFieldPath<StripeDataModel[TableName]["document"], Field>,
): Promise<StripeDataModel[TableName]["document"] | null> {
  return await context.db
    .query(table)
    .withIndex(indexName, (q) => q.eq(field, value))
    .unique();
}
