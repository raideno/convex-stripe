import Stripe from "stripe";

import { defineActionCallableFunction } from "@/helpers";
import { buildSignedReturnUrl } from "@/redirects";

export const CreateAccountLinkImplementation = defineActionCallableFunction<
  {
    refresh_url: string;
    return_url: string;
    failure_url?: string;
  } & Omit<Stripe.AccountLinkCreateParams, "refresh_url" | "return_url">,
  Stripe.RequestOptions,
  Promise<Stripe.Response<Stripe.AccountLink>>
>({
  name: "createAccountLink",
  handler: async (context, args, stripeOptions, configuration, options) => {
    const stripe = new Stripe(configuration.stripe.secret_key, {
      apiVersion: "2025-08-27.basil",
    });

    const refreshUrl = await buildSignedReturnUrl({
      configuration: configuration,
      origin: "create-account-link-refresh",
      data: {
        accountId: args.account,
      },
      failureUrl: args.failure_url,
      targetUrl: args.refresh_url,
    });
    const returnUrl = await buildSignedReturnUrl({
      configuration: configuration,
      origin: "create-account-link-return",
      data: {
        accountId: args.account,
      },
      failureUrl: args.failure_url,
      targetUrl: args.return_url,
    });

    const accountLink = await stripe.accountLinks.create(
      {
        ...{
          ...args,
        },
        account: args.account,
        refresh_url: refreshUrl,
        return_url: returnUrl,
      },
      Object.keys(stripeOptions).length === 0 ? undefined : stripeOptions,
    );

    return accountLink;
  },
});
