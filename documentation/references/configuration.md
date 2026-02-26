# `InputConfiguration`

The **input configuration** is what you provide when calling
`internalConvexStripe`.
Some fields are optional and defaults will be applied automatically.

```ts
export type InputConfiguration = {
  stripe: {
    secret_key: string;
    account_webhook_secret: string;
    connect_webhook_secret?: string;
  };

  /** Which tables to sync */
  sync?: {
  	stripeAccounts?: boolean;
    stripeProducts?: boolean;
    stripePrices?: boolean;
    stripeCustomers?: boolean;
    stripeSubscriptions?: boolean;
    stripeCoupons?: boolean;
    stripePromotionCodes?: boolean;
    stripePayouts?: boolean;
    stripeRefunds?: boolean;
    stripePaymentIntents?: boolean;
    stripeCheckoutSessions?: boolean;
    stripeInvoices?: boolean;
    stripeReviews?: boolean;
    stripePlans?: boolean;
    stripeDisputes?: boolean;
    stripeEarlyFraudWarnings?: boolean;
    stripeTaxIds?: boolean;
    stripeSetupIntents?: boolean;
    stripeCreditNotes?: boolean;
    stripeCharges?: boolean;
    stripePaymentMethods?: boolean;
    stripeSubscriptionSchedules?: boolean;
    stripeMandates?: boolean;
    stripeBillingPortalConfigurations?: boolean;
    stripeTransfers?: boolean;
    stripeCapabilities?: boolean;
  };

  /** Enable verbose logging */
  debug?: boolean;

  /** Custom logger (defaults to internal Logger) */
  logger?: Logger;

  /** Namespace prefix for internal functions (default: "stripe") */
  base?: string;
};
```

## Properties

### `stripe` (**required**)
Configuration for authenticating with Stripe.

| Key                      | Type     | Description                                                                                 | Required |
| ------------------------ | -------- | ------------------------------------------------------------------------------------------- | -------- |
| `secret_key`             | `string` | Stripe **secret key** (starts with `sk_...`). Used to call Stripe APIs.                     | ✅ Yes    |
| `account_webhook_secret` | `string` | Stripe **webhook signing secret** (starts with `whsec_...`). Used to verify account events. | ✅ Yes    |
| `connect_webhook_secret` | `string` | Stripe **webhook signing secret** (starts with `whsec_...`). Used to verify connect events. | ❌ No     |

### `sync` (optional)
Controls which Convex tables get synced from Stripe.
If omitted, **all tables are synced**.

| Table                             | Default | Purpose                                |
| :-------------------------------- | :------ | :------------------------------------- |
| stripeAccounts                    | `true`  | Sync stripeAccounts                    |
| stripeProducts                    | `true`  | Sync stripeProducts                    |
| stripePrices                      | `true`  | Sync stripePrices                      |
| stripeCustomers                   | `true`  | Sync stripeCustomers                   |
| stripeSubscriptions               | `true`  | Sync stripeSubscriptions               |
| stripeCoupons                     | `true`  | Sync stripeCoupons                     |
| stripePromotionCodes              | `true`  | Sync stripePromotionCodes              |
| stripePayouts                     | `true`  | Sync stripePayouts                     |
| stripeRefunds                     | `true`  | Sync stripeRefunds                     |
| stripePaymentIntents              | `true`  | Sync stripePaymentIntents              |
| stripeCheckoutSessions            | `true`  | Sync stripeCheckoutSessions            |
| stripeInvoices                    | `true`  | Sync stripeInvoices                    |
| stripeReviews                     | `true`  | Sync stripeReviews                     |
| stripePlans                       | `true`  | Sync stripePlans                       |
| stripeDisputes                    | `true`  | Sync stripeDisputes                    |
| stripeEarlyFraudWarnings          | `true`  | Sync stripeEarlyFraudWarnings          |
| stripeTaxIds                      | `true`  | Sync stripeTaxIds                      |
| stripeSetupIntents                | `true`  | Sync stripeSetupIntents                |
| stripeCreditNotes                 | `true`  | Sync stripeCreditNotes                 |
| stripeCharges                     | `true`  | Sync stripeCharges                     |
| stripePaymentMethods              | `true`  | Sync stripePaymentMethods              |
| stripeSubscriptionSchedules       | `true`  | Sync stripeSubscriptionSchedules       |
| stripeMandates                    | `true`  | Sync stripeMandates                    |
| stripeBillingPortalConfigurations | `true`  | Sync stripeBillingPortalConfigurations |
| stripeTransfers                   | `true`  | Sync stripeTransfers                   |
| stripeCapabilities                | `true`  | Sync stripeCapabilities                |

### `debug` (optional)
- Type: `boolean`.  
- Default: `false`.
If enabled, logs detailed information about sync operations, webhook processing,
and internal actions.

### `logger` (optional)
- Type: `Logger`.
- Default: an instance of the library’s own `Logger`.
Allows injecting a custom logging implementation.

### `base` (optional)
- Type: `string`.
- Default: `"stripe"` (since default file is `stripe.ts`).
File path exporting internal actions.
Example: if `base = "subscriptions"`, actions will be registered under
`internal.subscriptions.*`.

## Example

```ts
import { internalConvexStripe } from "@raideno/convex-stripe/server";

export const { stripe, store, sync, createEntity } = internalConvexStripe({
  stripe: {
    secret_key: process.env.STRIPE_SECRET_KEY!,
    account_webhook_secret: process.env.STRIPE_ACCOUNT_WEBHOOK_SECRET!,
  },
  // optional
  debug: true,
  sync: {
    // disable syncing payouts
    stripePayouts: false,
  },
});
```

📌 **Notes**
- Always provide both Stripe keys.
- If `sync` is omitted, **all syncable tables are enabled**.
- Use `debug` in development to troubleshoot Stripe webhooks.
