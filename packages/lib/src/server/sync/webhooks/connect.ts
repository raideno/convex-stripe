import Stripe from "stripe";

import { v } from "convex/values";

import { defineActionImplementation } from "@/helpers";
import { WEBHOOK_HANDLERS } from "@/webhooks";

export const SyncConnectWebhookImplementation = defineActionImplementation({
  args: v.object({}),
  name: "syncConnectWebhook",
  handler: async (context, args, configuration) => {
    const url = `${process.env.CONVEX_SITE_URL}${configuration.sync.webhooks.connect.path}`;

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
          "[STRIPE SYNC CONNECT WEBHOOK](Updated) Adding events:",
          Array.from(difference),
        );
        await stripe.webhookEndpoints.update(endpoint.id, {
          enabled_events: Array.from(events),
        });
        console.info("[STRIPE SYNC CONNECT WEBHOOK](Updated) Done.");
      } else {
        console.info("[STRIPE SYNC CONNECT WEBHOOK] Already up to date.");
      }

      return;
    } else {
      const endpoint = await stripe.webhookEndpoints.create({
        url: url,
        enabled_events: Array.from(events),
        description: configuration.sync.webhooks.connect.description,
        api_version: configuration.stripe.version,
        metadata: configuration.sync.webhooks.connect.metadata,
        connect: true,
      });

      console.info(
        "[STRIPE SYNC CONNECT WEBHOOK](Created). Secret have been returned. Set in convex as Environment Variable STRIPE_CONNECT_WEBHOOK_SECRET",
      );

      console.log("[STRIPE SYNC ACCOUNT WEBHOOK](Secret):", endpoint.secret);
    }
  },
});
