import { v } from "convex/values";
import Stripe from "stripe";

import { defineActionImplementation } from "@/helpers";
import { ChargeStripeToConvex } from "@/schema/models/charge";
import { storeDispatchTyped } from "@/store";
import { BY_STRIPE_ID_INDEX_NAME } from "@/schema";

export const ChargesSyncImplementation = defineActionImplementation({
  args: v.object({}),
  name: "charges",
  handler: async (context, args, configuration, options) => {
    if (configuration.sync.stripeCharges !== true) return;

    const stripe = new Stripe(configuration.stripe.secret_key, {
      apiVersion: "2025-08-27.basil",
    });

    const localChargesRes = await storeDispatchTyped(
      {
        operation: "selectAll",
        table: "stripeCharges",
      },
      context,
      configuration,
      options,
    );
    const localChargesById = new Map(
      (localChargesRes.docs || []).map((p: any) => [p.chargeId, p]),
    );

    const charges = await stripe.charges
      .list({ limit: 100 })
      .autoPagingToArray({ limit: 10_000 });

    const stripeChargeIds = new Set<string>();

    for (const charge of charges) {
      stripeChargeIds.add(charge.id);

      await storeDispatchTyped(
        {
          operation: "upsert",
          indexName: BY_STRIPE_ID_INDEX_NAME,
          table: "stripeCharges",
          idField: "chargeId",
          data: {
            chargeId: charge.id,
            stripe: ChargeStripeToConvex(charge),
            lastSyncedAt: Date.now(),
          },
        },
        context,
        configuration,
        options,
      );
    }

    for (const [chargeId] of localChargesById.entries()) {
      if (!stripeChargeIds.has(chargeId)) {
        await storeDispatchTyped(
          {
            operation: "deleteById",
            table: "stripeCharges",
            indexName: BY_STRIPE_ID_INDEX_NAME,
            idField: "chargeId",
            idValue: chargeId,
          },
          context,
          configuration,
          options,
        );
      }
    }
  },
});
