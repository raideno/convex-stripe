import Stripe from "stripe";

import { v } from "convex/values";

import { defineActionImplementation } from "@/helpers";
import { WEBHOOK_HANDLERS } from "@/webhooks";

export const SyncAccountWebhookImplementation = defineActionImplementation({
  args: v.object({}),
  name: "syncAccountWebhook",
  handler: async (context, args, configuration) => {
    const url = `${process.env.CONVEX_SITE_URL}${configuration.sync.webhooks.account.path}`;

    const events = new Set(
      WEBHOOK_HANDLERS.map((handler) => handler.events).flat(),
    );

    const stripe = new Stripe(configuration.stripe.secret_key, {
      apiVersion: configuration.stripe.version,
    });

    const endpoints = await stripe.webhookEndpoints
      .list({ limit: 100 })
      .autoPagingToArray({ limit: 10_000 });

    const endpoint = endpoints.find(
      (endpoint) => endpoint.url === url && endpoint.status === "enabled",
    );

    if (endpoint) {
      const enabled_events = new Set(endpoint.enabled_events);

      const difference = events.difference(enabled_events);

      if (difference.size !== 0) {
        console.info(
          "[STRIPE SYNC WEBHOOK](Updated) Adding events:",
          Array.from(difference),
        );
        await stripe.webhookEndpoints.update(endpoint.id, {
          enabled_events: Array.from(events),
        });
        console.info("[STRIPE SYNC ACCOUNT WEBHOOK](Updated) Done.");
      } else {
        console.info("[STRIPE SYNC ACCOUNT WEBHOOK] Already up to date.");
      }

      return;
    } else {
      const endpoint = await stripe.webhookEndpoints.create({
        url: url,
        enabled_events: Array.from(events),
        description: configuration.sync.webhooks.account.description,
        api_version: configuration.stripe.version,
        metadata: configuration.sync.webhooks.account.metadata,
        connect: false,
      });

      console.info(
        "[STRIPE SYNC ACCOUNT WEBHOOK](Created). Secret have been returned. Set in convex as Environment Variable STRIPE_ACCOUNT_WEBHOOK_SECRET.",
      );

      console.log("[STRIPE SYNC ACCOUNT WEBHOOK](Secret):", endpoint.secret);
    }
  },
});
