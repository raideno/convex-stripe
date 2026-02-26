import { Infer, v } from "convex/values";
import Stripe from "stripe";

import { metadata, nullablestring } from "@/schema/validators";

export const TransferStripeToConvex = (
  transfer: Stripe.Transfer & { id: string },
) => {
  const object: Infer<typeof TransferObject> = {
    id: transfer.id,
    amount: transfer.amount,
    currency: transfer.currency,
    description: transfer.description ?? null,
    destination:
      typeof transfer.destination === "string" ? transfer.destination : null,
    metadata: transfer.metadata ?? null,
    object: transfer.object,
    amount_reversed: transfer.amount_reversed,
    balance_transaction:
      typeof transfer.balance_transaction === "string"
        ? transfer.balance_transaction
        : null,
    created: transfer.created,
    destination_payment:
      typeof transfer.destination_payment === "string"
        ? transfer.destination_payment
        : null,
    livemode: transfer.livemode,
    // TODO: handle pagination for reversals if there are many
    reversals: transfer.reversals.data,
    reversed: transfer.reversed,
    source_transaction:
      typeof transfer.source_transaction === "string"
        ? transfer.source_transaction
        : null,
    source_type: transfer.source_type,
    transfer_group: transfer.transfer_group ?? null,
  };

  return object;
};

export const TransferSchema = {
  id: v.string(),
  amount: v.number(),
  currency: v.string(),
  description: v.optional(nullablestring()),
  destination: v.optional(nullablestring()),
  metadata: v.optional(v.union(metadata(), v.null())),
  object: v.string(),
  amount_reversed: v.number(),
  balance_transaction: v.optional(nullablestring()),
  created: v.number(),
  destination_payment: v.optional(nullablestring()),
  livemode: v.boolean(),
  // reversals: v.array(
  //   v.object({
  //     // TODO: complete
  //   }),
  // ),
  reversals: v.array(v.any()),
  reversed: v.boolean(),
  source_transaction: v.optional(nullablestring()),
  source_type: v.optional(nullablestring()),
  transfer_group: v.optional(nullablestring()),
};

export const TransferObject = v.object(TransferSchema);
