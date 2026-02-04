import { v } from "convex/values";
import Stripe from "stripe";

import { defineActionImplementation } from "@/helpers";
import { BY_STRIPE_ID_INDEX_NAME } from "@/schema";
import { EarlyFraudWarningStripeToConvex } from "@/schema/models/early-fraud-warning";
import { storeDispatchTyped } from "@/store";

export const EarlyFraudWarningsSyncImplementation = defineActionImplementation({
  args: v.object({}),
  name: "early_fraud_warnings",
  handler: async (context, args, configuration, options) => {
    if (configuration.sync.stripeEarlyFraudWarnings !== true) return;

    const stripe = new Stripe(configuration.stripe.secret_key, {
      apiVersion: "2025-08-27.basil",
    });

    const localEarlyFraudWarningsRes = await storeDispatchTyped(
      {
        operation: "selectAll",
        table: "stripeEarlyFraudWarnings",
      },
      context,
      configuration,
      options,
    );
    const localEarlyFraudWarningsById = new Map(
      (localEarlyFraudWarningsRes.docs || []).map((p: any) => [
        p.early_fraud_warningId,
        p,
      ]),
    );

    const early_fraud_warnings = await stripe.radar.earlyFraudWarnings
      .list({ limit: 100 })
      .autoPagingToArray({ limit: 10_000 });

    const stripeEarlyFraudWarningIds = new Set<string>();

    for (const early_fraud_warning of early_fraud_warnings) {
      stripeEarlyFraudWarningIds.add(early_fraud_warning.id);

      await storeDispatchTyped(
        {
          operation: "upsert",
          table: "stripeEarlyFraudWarnings",
          indexName: BY_STRIPE_ID_INDEX_NAME,
          idField: "earlyFraudWarningId",
          data: {
            earlyFraudWarningId: early_fraud_warning.id,
            stripe: EarlyFraudWarningStripeToConvex(early_fraud_warning),
            lastSyncedAt: Date.now(),
          },
        },
        context,
        configuration,
        options,
      );
    }

    for (const [
      early_fraud_warningId,
    ] of localEarlyFraudWarningsById.entries()) {
      if (!stripeEarlyFraudWarningIds.has(early_fraud_warningId)) {
        await storeDispatchTyped(
          {
            operation: "deleteById",
            table: "stripeEarlyFraudWarnings",
            indexName: BY_STRIPE_ID_INDEX_NAME,
            idField: "earlyFraudWarningId",
            idValue: early_fraud_warningId,
          },
          context,
          configuration,
          options,
        );
      }
    }
  },
});
