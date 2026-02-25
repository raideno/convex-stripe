import Stripe from "stripe";

import { storeDispatchTyped } from "@/store";

import { StripeDataModel } from "@/schema";
import { defineActionCallableFunction } from "../helpers";

export type ReturnType = StripeDataModel["stripeCustomers"]["document"];

export const CreateCustomerImplementation = defineActionCallableFunction<
  {
    entityId: string;
  } & Stripe.CustomerCreateParams,
  Stripe.RequestOptions,
  Promise<ReturnType>
>({
  name: "createCustomer",
  handler: async (context, args, stripeOptions, configuration, options) => {
    const stripe = new Stripe(configuration.stripe.secret_key, {
      apiVersion: "2025-08-27.basil",
    });

    // TODO: is it enough to check on the locally synced version, what if someone modifies the dashboard in the mean time
    // And deletes the customer, we'll then have an issue as we'll return a customerId that don't exist anymore
    const stripeCustomer = (
      await storeDispatchTyped(
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
      )
    ).doc;

    if (stripeCustomer) {
      return stripeCustomer;
    } else {
      const customer = await stripe.customers.create(
        {
          ...args,
          metadata: {
            ...(args.metadata || {}),
            entityId: args.entityId,
          },
        },
        stripeOptions,
      );

      const data = {
        entityId: args.entityId,
        customerId: customer.id,
        stripe: {
          id: customer.id,
          address: customer.address,
          description: customer.description,
          email: customer.email,
          metadata: customer.metadata,
          name: customer.name,
          phone: customer.phone,
          shipping: customer.shipping,
          tax: customer.tax,
          object: customer.object,
          balance: customer.balance,
          cash_balance: customer.cash_balance,
          created: customer.created,
          currency: customer.currency,
          default_source:
            typeof customer.default_source === "string"
              ? customer.default_source
              : customer.default_source?.id,
          delinquent: customer.delinquent,
          discount: customer.discount,
          invoice_credit_balance: customer.invoice_credit_balance,
          invoice_prefix: customer.invoice_prefix,
          invoice_settings: customer.invoice_settings,
          livemode: customer.livemode,
          next_invoice_sequence: customer.next_invoice_sequence,
          preferred_locales: customer.preferred_locales,
          sources: customer.sources,
          subscriptions: customer.subscriptions,
          tax_exempt: customer.tax_exempt,
          tax_ids: customer.tax_ids,
          test_clock:
            typeof customer.test_clock === "string"
              ? customer.test_clock
              : customer.test_clock?.id,
        },
        lastSyncedAt: Date.now(),
      };

      const response = await storeDispatchTyped(
        {
          operation: "upsert",
          table: "stripeCustomers",
          indexName: "byEntityId",
          idField: "entityId",
          data: data,
        },
        context,
        configuration,
        options,
      );

      return {
        _id: response.id,
        ...data,
        _creationTime: new Date().getTime(),
      };
    }
  },
});
