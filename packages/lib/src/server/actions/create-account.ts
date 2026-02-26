import Stripe from "stripe";

import { storeDispatchTyped } from "@/store";

import { StripeDataModel } from "@/schema";
import { defineActionCallableFunction } from "../helpers";

export type ReturnType = StripeDataModel["stripeAccounts"]["document"];

export const CreateAccountImplementation = defineActionCallableFunction<
  {
    entityId: string;
  } & Omit<Stripe.AccountCreateParams, "type">,
  Stripe.RequestOptions,
  Promise<ReturnType>
>({
  name: "createAccount",
  handler: async (context, args, stripeOptions, configuration, options) => {
    const stripe = new Stripe(configuration.stripe.secret_key, {
      apiVersion: configuration.stripe.version,
    });

    // TODO: is it enough to check on the locally synced version, what if someone modifies the dashboard in the mean time
    // And deletes the customer, we'll then have an issue as we'll return a customerId that don't exist anymore
    const stripeAccount = (
      await storeDispatchTyped(
        {
          operation: "selectOne",
          table: "stripeAccounts",
          indexName: "byEntityId",
          field: "entityId",
          value: args.entityId,
        },
        context,
        configuration,
        options,
      )
    ).doc;

    if (stripeAccount) {
      return stripeAccount;
    } else {
      const account = await stripe.accounts.create(
        {
          ...{
            ...args,
            entityId: undefined,
          },
          metadata: {
            ...(args.metadata || {}),
            entityId: args.entityId,
          },
        },
        Object.keys(stripeOptions).length === 0 ? undefined : stripeOptions,
      );

      const data = {
        entityId: args.entityId,
        accountId: account.id,
        stripe: {
          id: account.id,
          object: account.object,
          business_type: account.business_type,
          capabilities: account.capabilities,
          company: account.company,
          country: account.country,
          email: account.email,
          individual: account.individual,
          metadata: account.metadata,
          requirements: account.requirements,
          tos_acceptance: account.tos_acceptance,
          type: account.type,
          business_profile: account.business_profile,
          charges_enabled: account.charges_enabled,
          controller: account.controller,
          created: account.created,
          default_currency: account.default_currency,
          details_submitted: account.details_submitted,
          external_accounts: account.external_accounts,
          future_requirements: account.future_requirements,
          groups: account.groups,
          payouts_enabled: account.payouts_enabled,
          settings: account.settings,
        },
        lastSyncedAt: Date.now(),
      };

      const response = await storeDispatchTyped(
        {
          operation: "upsert",
          table: "stripeAccounts",
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
