import Stripe from "stripe";

import { v } from "convex/values";

import { defineActionImplementation } from "@/helpers";
import { WEBHOOK_HANDLERS } from "@/webhooks";

export const SyncWebhookImplementation = defineActionImplementation({
  args: v.object({}),
  name: "syncWebhook",
  handler: async (context, args, configuration) => {
    const url = `${process.env.CONVEX_SITE_URL}${configuration.webhook.path}`;

    const events = new Set(
      WEBHOOK_HANDLERS.map((handler) => handler.events).flat()
    );

    const stripe = new Stripe(configuration.stripe.secret_key, {
      apiVersion: "2025-08-27.basil",
    });

    const endpoints = await stripe.webhookEndpoints
      .list({ limit: 100 })
      .autoPagingToArray({ limit: 10_000 });

    const endpoint = endpoints.find((endpoint) => endpoint.url === url);

    if (endpoint) {
      const enabled_events = new Set(endpoint.enabled_events);

      const difference = events.difference(enabled_events);

      if (difference.size !== 0) {
        console.info(
          "[STRIPE SYNC WEBHOOK](Updated) Adding events:",
          Array.from(difference)
        );
        await stripe.webhookEndpoints.update(endpoint.id, {
          enabled_events: Array.from(events),
        });
        console.info("[STRIPE SYNC WEBHOOK](Updated) Done.");
      } else {
        console.info("[STRIPE SYNC WEBHOOK] Already up to date.");
      }

      return null;
    } else {
      const endpoint = await stripe.webhookEndpoints.create({
        url: url,
        enabled_events: Array.from(events),
        description: configuration.webhook.description,
        api_version: "2025-08-27.basil",
        metadata: configuration.webhook.metadata,
      });

      console.info(
        "[STRIPE SYNC WEBHOOK](Created). Secret have been returned."
      );
      console.info(
        "Set in convex as Environment Variable STRIPE_WEBHOOK_SECRET"
      );

      return endpoint.secret!;
    }
  },
});
