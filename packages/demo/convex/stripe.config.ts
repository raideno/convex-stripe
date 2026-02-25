import { InputConfiguration } from "@raideno/convex-stripe/server";

export default {
  stripe: {
    secret_key: process.env.STRIPE_SECRET_KEY!,
    account_webhook_secret: process.env.STRIPE_ACCOUNT_WEBHOOK_SECRET!,
    connect_webhook_secret: process.env.STRIPE_CONNECT_WEBHOOK_SECRET!,
  },

  debug: true,
} as InputConfiguration;
