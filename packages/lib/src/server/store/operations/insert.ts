import { GenericMutationCtx, WithoutSystemFields } from "convex/server";
import { GenericId } from "convex/values";

import { StripeDataModel } from "@/schema";

export async function insert<TableName extends keyof StripeDataModel>(
  context: GenericMutationCtx<StripeDataModel>,
  table: TableName,
  data: WithoutSystemFields<StripeDataModel[TableName]["document"]>,
): Promise<GenericId<TableName>> {
  return await context.db.insert(table, {
    ...data,
    lastSyncedAt: Date.now(),
  });
}
