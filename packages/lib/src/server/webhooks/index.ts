import { GenericActionCtx } from "convex/server";
import Stripe from "stripe";

import { StripeDataModel } from "@/schema";
import { InternalConfiguration, InternalOptions } from "@/types";

import { WebhookHandler } from "./types";

import AccountsHandlerImplementation from "./handlers/accounts.handler";
import BillingPortalConfigurationHandlerImplementation from "./handlers/billing-portal-configuration.handler";
import CapabilitiesHandlerImplementation from "./handlers/capabilities.handler";
import ChargesHandlerImplementation from "./handlers/charges.handler";
import CheckoutSessionsHandlerImplementation from "./handlers/checkout-sessions.handler";
import CouponsHandlerImplementation from "./handlers/coupons.handler";
import CreditNotesHandlerImplementation from "./handlers/credit-notes.handler";
import CustomersHandlerImplementation from "./handlers/customers.handler";
import DisputesHandlerImplementation from "./handlers/disputes.handler";
import EarlyFraudWarningsHandlerImplementation from "./handlers/early-fraud-warnings.handler";
import InvoicesHandlerImplementation from "./handlers/invoices.handler";
import MandatesHandlerImplementation from "./handlers/mandates.handler";
import PaymentIntentsHandlerImplementation from "./handlers/payment-intents.handler";
import PaymentMethodsHandlerImplementation from "./handlers/payment-methods.handler";
import PayoutsHandlerImplementation from "./handlers/payouts.handler";
import PlansHandlerImplementation from "./handlers/plans.handler";
import PricesHandlerImplementation from "./handlers/prices.handler";
import ProductsHandlerImplementation from "./handlers/products.handler";
import PromotionCodesHandlerImplementation from "./handlers/promotion-codes.handler";
import RefundsHandlerImplementation from "./handlers/refunds.handler";
import ReviewsHandlerImplementation from "./handlers/reviews.handler";
import SetupIntentHandlerImplementation from "./handlers/setup-intent.handler";
import SubscriptionSchedulesHandlerImplementation from "./handlers/subscription-schedules.handler";
import SubscriptionsHandlerImplementation from "./handlers/subscriptions.handler";
import TaxIdHandlerImplementation from "./handlers/tax-id.handler";
import TransfersHandlerImplementation from "./handlers/transfers.handler";

export const WEBHOOK_HANDLERS = [
  AccountsHandlerImplementation,
  BillingPortalConfigurationHandlerImplementation,
  CapabilitiesHandlerImplementation,
  ChargesHandlerImplementation,
  CheckoutSessionsHandlerImplementation,
  CouponsHandlerImplementation,
  CreditNotesHandlerImplementation,
  CustomersHandlerImplementation,
  DisputesHandlerImplementation,
  EarlyFraudWarningsHandlerImplementation,
  InvoicesHandlerImplementation,
  MandatesHandlerImplementation,
  PaymentIntentsHandlerImplementation,
  PaymentMethodsHandlerImplementation,
  PayoutsHandlerImplementation,
  PlansHandlerImplementation,
  PricesHandlerImplementation,
  ProductsHandlerImplementation,
  PromotionCodesHandlerImplementation,
  RefundsHandlerImplementation,
  ReviewsHandlerImplementation,
  SetupIntentHandlerImplementation,
  SubscriptionSchedulesHandlerImplementation,
  SubscriptionsHandlerImplementation,
  TaxIdHandlerImplementation,
  TransfersHandlerImplementation,
] as const;

if (
  WEBHOOK_HANDLERS.some(
    (handler) => !["handle", "events"].every((key) => key in handler),
  )
)
  throw new Error(
    "Each webhook handler file should export a valid implementation",
  );

export const webhookImplementation = async (
  configuration: InternalConfiguration,
  options: InternalOptions,
  context: GenericActionCtx<StripeDataModel>,
  request: Request,
  connect?: boolean,
  stripe_?: Stripe,
) => {
  const body = await request.text();
  const signature = request.headers.get("Stripe-Signature");

  if (!signature) return new Response("No signature", { status: 400 });

  const stripe = stripe_
    ? stripe_
    : new Stripe(configuration.stripe.secret_key, {
        apiVersion: configuration.stripe.version,
      });

  if (typeof signature !== "string")
    return new Response("Invalid signature", { status: 400 });

  const secret = connect
    ? configuration.stripe.connect_webhook_secret
    : configuration.stripe.account_webhook_secret;

  if (!secret) {
    options.logger.error(
      "Received account related webhook but no account_webhook_secret is configured",
    );
    return new Response("No account webhook secret configured", {
      status: 400,
    });
  }

  const event = await stripe.webhooks.constructEventAsync(
    body,
    signature,
    secret,
  );

  options.logger.debug(`[STRIPE HOOK](RECEIVED): ${event.type}`);

  for (const handler of WEBHOOK_HANDLERS) {
    // @ts-expect-error
    if (handler.events.includes(event.type)) {
      try {
        // @ts-ignore
        await handler.handle(event, context, configuration, options);
        options.logger.debug(`[STRIPE HOOK](HANDLED): ${event.type}`);
      } catch (error) {
        options.logger.error(`[STRIPE HOOK](Error): ${error}`);
      }
    }
  }

  for (const handler of configuration.webhook.handlers) {
    if (handler.events.includes(event.type)) {
      try {
        await handler.handle(event, context, configuration, options);
        options.logger.debug(`[STRIPE HOOK](HANDLED BY CONFIG): ${event.type}`);
      } catch (error) {
        options.logger.error(
          `[STRIPE HOOK](Error in config handler): ${error}`,
        );
      }
    }
  }

  return new Response("OK", { status: 200 });
};
