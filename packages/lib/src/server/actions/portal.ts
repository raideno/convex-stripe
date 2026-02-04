import Stripe from "stripe";

import { CreateEntityImplementation } from "@/actions/create-entity";
import { buildSignedReturnUrl } from "@/redirects";
import { storeDispatchTyped } from "@/store";

import { defineActionCallableFunction } from "../helpers";

const DEFAULT_CREATE_STRIPE_CUSTOMER_IF_MISSING = true;

export const PortalImplementation = defineActionCallableFunction<
  {
    createStripeCustomerIfMissing?: boolean;
    entityId: string;
    return_url: string;
  } & Omit<Stripe.BillingPortal.SessionCreateParams, "customer" | "return_url">,
  Stripe.RequestOptions,
  Promise<Stripe.Response<Stripe.BillingPortal.Session>>
>({
  name: "portal",
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

    const returnUrl = await buildSignedReturnUrl({
      configuration: configuration,
      origin: "portal-return",
      data: {
        entityId: args.entityId,
      },
      targetUrl: args.return_url,
    });

    const portal = await stripe.billingPortal.sessions.create(
      {
        ...{
          ...args,
          createStripeCustomerIfMissing: undefined,
          entityId: undefined,
          return_url: undefined,
        },
        customer: customerId,
        return_url: returnUrl,
      },
      Object.keys(stripeOptions).length === 0 ? undefined : stripeOptions,
    );

    return portal;
  },
});
