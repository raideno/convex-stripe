import { Infer, v } from "convex/values";
import Stripe from "stripe";

export const AccountLinkStripeToConvex = (account: Stripe.AccountLink) => {
  const object: Infer<typeof AccountLinkObject> = {
    object: account.object,
    created: account.created,
    expires_at: account.expires_at,
    url: account.url,
  };

  return object;
};

export const AccountLinkSchema = {
  expires_at: v.number(),
  url: v.string(),
  object: v.string(),
  created: v.number(),
};

export const AccountLinkObject = v.object(AccountLinkSchema);
