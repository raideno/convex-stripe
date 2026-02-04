import Stripe from "stripe";

import { CreateEntityImplementation } from "@/actions/create-entity";
import { buildSignedReturnUrl } from "@/redirects";
import { BY_STRIPE_ID_INDEX_NAME } from "@/schema";
import { CheckoutSessionStripeToConvex } from "@/schema/models/checkout-session";
import { SubscriptionStripeToConvex } from "@/schema/models/subscription";
import { storeDispatchTyped } from "@/store";

import { defineActionCallableFunction } from "../helpers";

const DEFAULT_CREATE_STRIPE_CUSTOMER_IF_MISSING = true;

export const SubscribeImplementation = defineActionCallableFunction<
  {
    createStripeCustomerIfMissing?: boolean;
    entityId: string;
    priceId: string;
    cancel_url: string;
    success_url: string;
    failure_url?: string;
    mode: "subscription";
  } & Omit<
    Stripe.Checkout.SessionCreateParams,
    | "customer"
    | "ui_mode"
    | "mode"
    | "line_items"
    | "client_reference_id"
    | "success_url"
    | "cancel_url"
  >,
  Stripe.RequestOptions,
  Promise<Stripe.Response<Stripe.Checkout.Session>>
>({
  name: "subscriptionCheckout",
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
        indexName: "byEntityId",
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
      origin: "subscribe-success",
      data: {
        entityId: args.entityId,
      },
      failureUrl: args.failure_url,
      targetUrl: args.success_url,
    });
    const cancelUrl = await buildSignedReturnUrl({
      configuration: configuration,
      origin: "subscribe-cancel",
      data: {
        entityId: args.entityId,
      },
      failureUrl: args.failure_url,
      targetUrl: args.cancel_url,
    });

    const checkout = await stripe.checkout.sessions.create(
      {
        ...{
          ...args,
          createStripeCustomerIfMissing: undefined,
          entityId: undefined,
          priceId: undefined,
          cancel_url: undefined,
          success_url: undefined,
          mode: undefined,
        },
        customer: customerId,
        ui_mode: "hosted",
        mode: args.mode,
        line_items: [
          {
            price: args.priceId,
            quantity: 1,
          },
        ],
        metadata: {
          ...(args.metadata || {}),
          entityId: args.entityId,
          customerId: customerId,
        },
        client_reference_id: args.entityId,
        success_url: successUrl,
        cancel_url: cancelUrl,
        subscription_data: {
          ...args.subscription_data,
          metadata: {
            ...(args.subscription_data?.metadata || {}),
            entityId: args.entityId,
            customerId: customerId,
          },
        },
        expand: [...(args.expand || []), "subscription"],
      },
      Object.keys(stripeOptions).length === 0 ? undefined : stripeOptions,
    );

    await storeDispatchTyped(
      {
        operation: "upsert",
        table: "stripeCheckoutSessions",
        indexName: BY_STRIPE_ID_INDEX_NAME,
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

    const subscription = checkout.subscription;

    if (
      subscription &&
      subscription !== null &&
      typeof subscription !== "string"
    ) {
      await storeDispatchTyped(
        {
          operation: "upsert",
          table: "stripeSubscriptions",
          indexName: BY_STRIPE_ID_INDEX_NAME,
          idField: "subscriptionId",
          data: {
            subscriptionId: subscription.id,
            customerId: customerId,
            stripe: SubscriptionStripeToConvex(subscription),
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
