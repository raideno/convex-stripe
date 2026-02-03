import Stripe from "stripe";

import { CreateEntityImplementation } from "@/actions/setup";
import { buildSignedReturnUrl } from "@/redirects";
import { CheckoutSessionStripeToConvex } from "@/schema/models/checkout-session";
import { PaymentIntentStripeToConvex } from "@/schema/models/payment-intent";
import { storeDispatchTyped } from "@/store";

import { defineActionCallableFunction } from "../helpers";

const DEFAULT_CREATE_STRIPE_CUSTOMER_IF_MISSING = true;

export const PayImplementation = defineActionCallableFunction<
  {
    createStripeCustomerIfMissing?: boolean;
    entityId: string;
    cancel_url: string;
    success_url: string;
    referenceId: string;
    mode: "payment";
  } & Omit<
    Stripe.Checkout.SessionCreateParams,
    | "customer"
    | "ui_mode"
    | "mode"
    | "client_reference_id"
    | "success_url"
    | "cancel_url"
  >,
  Stripe.RequestOptions,
  Promise<Stripe.Response<Stripe.Checkout.Session>>
>({
  name: "pay",
  handler: async (context, args, stripeOptions, configuration, options) => {
    const createStripeCustomerIfMissing =
      args.createStripeCustomerIfMissing ??
      DEFAULT_CREATE_STRIPE_CUSTOMER_IF_MISSING;

    const stripe = new Stripe(configuration.stripe.secret_key, {
      apiVersion: "2025-08-27.basil",
    });

    const stripeCustomer = await storeDispatchTyped(
      {
        operation: "selectOne",
        table: "stripeCustomers",
        field: "entityId",
        value: args.entityId,
      },
      context,
      configuration,
      options,
    );

    let customerId = stripeCustomer?.doc?.customerId || null;

    if (!customerId) {
      if (!createStripeCustomerIfMissing) {
        throw new Error(
          `No Stripe customer ID found for this entityId: ${args.entityId}`,
        );
      } else {
        customerId = (
          await CreateEntityImplementation.handler(
            context,
            {
              entityId: args.entityId,
              email: undefined,
              metadata: undefined,
            },
            configuration,
            options,
          )
        ).customerId;
      }
    }

    const successUrl = await buildSignedReturnUrl({
      configuration: configuration,
      origin: "pay-success",
      data: {
        entityId: args.entityId,
        referenceId: args.referenceId,
        customerId: customerId,
      },
      targetUrl: args.success_url,
    });
    const cancelUrl = await buildSignedReturnUrl({
      configuration: configuration,
      origin: "pay-cancel",
      data: {
        entityId: args.entityId,
        referenceId: args.referenceId,
        customerId: customerId,
      },
      targetUrl: args.cancel_url,
    });

    const checkout = await stripe.checkout.sessions.create(
      {
        ...{
          ...args,
          createStripeCustomerIfMissing: undefined,
          entityId: undefined,
          cancel_url: undefined,
          success_url: undefined,
          referenceId: undefined,
          mode: undefined,
        },
        customer: customerId,
        ui_mode: "hosted",
        mode: args.mode,
        client_reference_id: args.referenceId,
        metadata: {
          ...args.metadata,
          entityId: args.entityId,
          customerId: customerId,
          referenceId: args.referenceId,
        },
        line_items: args.line_items,
        success_url: successUrl,
        cancel_url: cancelUrl,
        payment_intent_data: {
          ...(args.payment_intent_data || {}),
          metadata: {
            ...(args.payment_intent_data?.metadata || {}),
            entityId: args.entityId,
            customerId: customerId,
            referenceId: args.referenceId,
          },
        },
        expand: [...(args.expand || []), "payment_intent"],
      },
      Object.keys(stripeOptions).length === 0 ? undefined : stripeOptions,
    );

    await storeDispatchTyped(
      {
        operation: "upsert",
        table: "stripeCheckoutSessions",
        idField: "checkoutSessionId",
        data: {
          checkoutSessionId: checkout.id,
          stripe: CheckoutSessionStripeToConvex(checkout),
          lastSyncedAt: Date.now(),
        },
      },
      context,
      configuration,
      options,
    );

    const paymentIntent = checkout.payment_intent;

    if (
      paymentIntent &&
      paymentIntent !== null &&
      typeof paymentIntent !== "string"
    ) {
      await storeDispatchTyped(
        {
          operation: "upsert",
          table: "stripePaymentIntents",
          idField: "paymentIntentId",
          data: {
            paymentIntentId: paymentIntent.id,
            stripe: PaymentIntentStripeToConvex(paymentIntent),
            lastSyncedAt: Date.now(),
          },
        },
        context,
        configuration,
        options,
      );
    }

    return checkout;
  },
});
