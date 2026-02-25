import { v } from "convex/values";
import Stripe from "stripe";

import { defineActionImplementation } from "@/helpers";
import { BY_STRIPE_ID_INDEX_NAME } from "@/schema";
import { TransferStripeToConvex } from "@/schema/models/transfer";
import { storeDispatchTyped } from "@/store";

export const TransfersSyncImplementation = defineActionImplementation({
  args: v.object({
    accountId: v.optional(v.string()),
  }),
  name: "transfers",
  handler: async (context, args, configuration, options) => {
    if (configuration.sync.stripeTransfers !== true) return;

    const stripe = new Stripe(configuration.stripe.secret_key, {
      apiVersion: "2025-08-27.basil",
    });

    const localTransfersRes = await storeDispatchTyped(
      {
        operation: "selectAll",
        table: "stripeTransfers",
      },
      context,
      configuration,
      options,
    );
    const localTransfersById = new Map(
      (localTransfersRes.docs || []).map((p) => [p.transferId, p]),
    );

    const transfers = await stripe.transfers
      .list({ limit: 100 }, { stripeAccount: args.accountId })
      .autoPagingToArray({ limit: 10_000 });

    const stripeTransferIds = new Set<string>();

    for (const transfer of transfers) {
      stripeTransferIds.add(transfer.id);

      await storeDispatchTyped(
        {
          operation: "upsert",
          table: "stripeTransfers",
          indexName: BY_STRIPE_ID_INDEX_NAME,
          idField: "transferId",
          data: {
            transferId: transfer.id,
            stripe: TransferStripeToConvex(transfer),
            lastSyncedAt: Date.now(),
            accountId: args.accountId,
          },
        },
        context,
        configuration,
        options,
      );
    }

    // for (const [transferId] of localTransfersById.entries()) {
    //   if (!stripeTransferIds.has(transferId)) {
    //     await storeDispatchTyped(
    //       {
    //         operation: "deleteById",
    //         table: "stripeTransfers",
    //         indexName: BY_STRIPE_ID_INDEX_NAME,
    //         idField: "transferId",
    //         idValue: transferId,
    //       },
    //       context,
    //       configuration,
    //       options,
    //     );
    //   }
    // }
  },
});
