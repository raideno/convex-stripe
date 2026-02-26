import { v } from "convex/values";
import Stripe from "stripe";

import { defineActionImplementation } from "@/helpers";
import { BY_STRIPE_ID_INDEX_NAME } from "@/schema";
import { InvoiceStripeToConvex } from "@/schema/models/invoice";
import { storeDispatchTyped } from "@/store";

export const InvoicesSyncImplementation = defineActionImplementation({
  args: v.object({
    accountId: v.optional(v.string()),
  }),
  name: "invoices",
  handler: async (context, args, configuration, options) => {
    if (configuration.sync.tables.stripeInvoices !== true) return;

    const stripe = new Stripe(configuration.stripe.secret_key, {
      apiVersion: configuration.stripe.version,
    });

    const invoices = await stripe.invoices
      .list({ limit: 100 }, { stripeAccount: args.accountId })
      .autoPagingToArray({ limit: 10_000 });

    const stripeInvoiceIds = new Set<string>();

    for (const invoice of invoices) {
      if (invoice.id === undefined) {
        console.warn("Invoice with undefined ID found, skipping");
        continue;
      }

      stripeInvoiceIds.add(invoice.id);

      await storeDispatchTyped(
        {
          operation: "upsert",
          table: "stripeInvoices",
          idField: "invoiceId",
          indexName: BY_STRIPE_ID_INDEX_NAME,
          data: {
            invoiceId: invoice.id,
            stripe: InvoiceStripeToConvex({
              id: invoice.id,
              ...invoice,
            }),
            accountId: args.accountId,
            lastSyncedAt: Date.now(),
          },
        },
        context,
        configuration,
        options,
      );
    }
  },
});
