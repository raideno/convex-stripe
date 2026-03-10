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

type IndexValuesFor<
  TableName extends keyof StripeDataModel,
  IndexName extends keyof StripeDataModel[TableName]["indexes"] & string,
> = {
  [K in StripeIndexFieldPath<TableName, IndexName> &
    string]?: FieldTypeFromFieldPath<StripeDataModel[TableName]["document"], K>;
};

export async function selectOne<
  TableName extends keyof StripeDataModel,
  IndexName extends keyof StripeDataModel[TableName]["indexes"] & string,
>(
  context: GenericMutationCtx<StripeDataModel>,
  table: TableName,
  indexName: IndexName,
  indexValues: IndexValuesFor<TableName, IndexName>,
): Promise<StripeDataModel[TableName]["document"] | null> {
  return await context.db
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
}
