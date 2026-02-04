import { v } from "convex/values";
import Stripe from "stripe";

import { defineActionImplementation } from "@/helpers";
import { BY_STRIPE_ID_INDEX_NAME } from "@/schema";
import { CreditNoteStripeToConvex } from "@/schema/models/credit-note";
import { storeDispatchTyped } from "@/store";

export const CreditNotesSyncImplementation = defineActionImplementation({
  args: v.object({}),
  name: "creditNotes",
  handler: async (context, args, configuration, options) => {
    if (configuration.sync.stripeCreditNotes !== true) return;

    const stripe = new Stripe(configuration.stripe.secret_key, {
      apiVersion: "2025-08-27.basil",
    });

    const localCreditNotesRes = await storeDispatchTyped(
      {
        operation: "selectAll",
        table: "stripeCreditNotes",
      },
      context,
      configuration,
      options,
    );
    const localCreditNotesById = new Map(
      (localCreditNotesRes.docs || []).map((p: any) => [p.creditNoteId, p]),
    );

    const creditNotes = await stripe.creditNotes
      .list({ limit: 100 })
      .autoPagingToArray({ limit: 10_000 });

    const stripeCreditNoteIds = new Set<string>();

    for (const creditNote of creditNotes) {
      stripeCreditNoteIds.add(creditNote.id);

      await storeDispatchTyped(
        {
          operation: "upsert",
          table: "stripeCreditNotes",
          indexName: BY_STRIPE_ID_INDEX_NAME,
          idField: "creditNoteId",
          data: {
            creditNoteId: creditNote.id,
            stripe: CreditNoteStripeToConvex(creditNote),
            lastSyncedAt: Date.now(),
          },
        },
        context,
        configuration,
        options,
      );
    }

    for (const [creditNoteId] of localCreditNotesById.entries()) {
      if (!stripeCreditNoteIds.has(creditNoteId)) {
        await storeDispatchTyped(
          {
            operation: "deleteById",
            table: "stripeCreditNotes",
            indexName: BY_STRIPE_ID_INDEX_NAME,
            idField: "creditNoteId",
            idValue: creditNoteId,
          },
          context,
          configuration,
          options,
        );
      }
    }
  },
});
