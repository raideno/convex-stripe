# Convex Stripe

Stripe [syncing](./documentation/references/tables.md), subscriptions, [checkouts](#stripesubscribe), one time payments, billing portal and Stripe Connect for Convex apps. Implemented according to the best practices listed in [Theo's Stripe Recommendations](https://github.com/t3dotgg/stripe-recommendations).

## Table of Contents

- [Convex Stripe](#convex-stripe)
  - [Table of Contents](#table-of-contents)
  - [Installation](#installation)
  - [Usage](#usage)
    - [1. Set up Stripe](#1-set-up-stripe)
    - [2. Set Environment Variables on Convex](#2-set-environment-variables-on-convex)
    - [3. Add Tables](#3-add-tables)
    - [4. Initialize the Library](#4-initialize-the-library)
    - [5. Register HTTP Routes](#5-register-http-routes)
    - [6. Stripe Customers](#6-stripe-customers)
    - [7. Run the `sync` Action](#7-run-the-sync-action)
    - [8. Start Building](#8-start-building)
  - [Configuration](#configuration)
    - [Schema Configuration](#schema-configuration)
    - [Stripe Configuration](#stripe-configuration)
    - [Sync Configuration](#sync-configuration)
      - [Catalog (Unstable)](#catalog-unstable)
      - [Webhook Configuration](#webhook-configuration)
      - [Portal Configuration](#portal-configuration)
    - [Callbacks](#callbacks)
    - [Custom Webhook Handlers](#custom-webhook-handlers)
    - [Custom Redirect Handlers](#custom-redirect-handlers)
      - [`buildSignedReturnUrl`](#buildsignedreturnurl)
    - [Options](#options)
  - [Stripe Connect](#stripe-connect)
    - [0. Enable Connect on your Stripe dashboard.](#0-enable-connect-on-your-stripe-dashboard)
    - [1. Create a Connect webhook using the `sync` action.](#1-create-a-connect-webhook-using-the-sync-action)
    - [2. Add the new webhook secret to your Convex environment and configuration.](#2-add-the-new-webhook-secret-to-your-convex-environment-and-configuration)
    - [3. Create Stripe Accounts for Sellers \& Onboard them](#3-create-stripe-accounts-for-sellers--onboard-them)
    - [4. Create Products for Sellers](#4-create-products-for-sellers)
    - [5. Send Payouts](#5-send-payouts)
  - [API Reference](#api-reference)
    - [`stripe.customers.create`](#stripecustomerscreate)
    - [`stripe.subscribe`](#stripesubscribe)
    - [`stripe.pay`](#stripepay)
    - [`stripe.portal`](#stripeportal)
    - [`stripe.accounts.create`](#stripeaccountscreate)
    - [`stripe.accounts.link`](#stripeaccountslink)
    - [`stripe.addHttpRoutes`](#stripeaddhttproutes)
    - [`stripe.client`](#stripeclient)
    - [`sync` Action](#sync-action)
    - [`store` Mutation](#store-mutation)
    - [`stripe.helpers`](#stripehelpers)
    - [`helpers.createCustomer`](#helperscreatecustomer)
    - [`helpers.products`](#helpersproducts)
    - [`helpers.subscription`](#helperssubscription)
    - [`helpers.customer`](#helperscustomer)
  - [Synced Tables](#synced-tables)
  - [Synced Events](#synced-events)
  - [Best Practices](#best-practices)
  - [Resources](#resources)
  - [Development](#development)
  - [Contributions](#contributions)

## Installation

```sh
npm install @raideno/convex-stripe stripe
```

## Usage

### 1. Set up Stripe
- Create a Stripe account.
- Configure a webhook endpoint pointing to:
  ```
  https://<your-convex-app>.convex.site/stripe/webhook
  ```
- Enable the required [Stripe Events](#synced-events) on the webhook.
- Enable the [Stripe Billing Portal](https://dashboard.stripe.com/test/settings/billing/portal).

### 2. Set Environment Variables on Convex

```bash
npx convex env set STRIPE_SECRET_KEY "<secret>"
npx convex env set STRIPE_ACCOUNT_WEBHOOK_SECRET "<secret>"
```

If you plan to use Stripe Connect, also set:

```bash
npx convex env set STRIPE_CONNECT_WEBHOOK_SECRET "<secret>"
```

### 3. Add Tables

Spread the `stripeTables` export into your Convex schema. This creates all the [synced tables](#synced-tables) that the library uses to mirror Stripe data locally.

```ts
// convex/schema.ts

import { defineSchema } from "convex/server";
import { stripeTables } from "@raideno/convex-stripe/server";

export default defineSchema({
  ...stripeTables,
  // your other tables...
});
```

If you only want to sync specific tables and avoid creating empty tables in your database, you can use the `allStripeTablesExcept` or `onlyStripeTables` helpers instead of `stripeTables`:

```ts
// convex/schema.ts

import { defineSchema } from "convex/server";
import { onlyStripeTables } from "@raideno/convex-stripe/server";

export default defineSchema({
  ...onlyStripeTables(["stripeCustomers", "stripeSubscriptions", "stripeProducts", "stripePrices"]),
  // your other tables...
});
```

The package will only sync the tables you defined.

See [Tables Reference](./documentation/references/tables.md) for the full list of tables and their schemas.

### 4. Initialize the Library

Call `internalConvexStripe` with your Stripe credentials and sync configuration. This returns a `stripe` object with all the action functions, a `store` internal mutation and a `sync` internal action.

```ts
// convex/stripe.ts

import { internalConvexStripe } from "@raideno/convex-stripe/server";

import schema from "./schema";

export const { stripe, store, sync } = internalConvexStripe({
  schema: schema,
  stripe: {
    secret_key: process.env.STRIPE_SECRET_KEY!,
    account_webhook_secret: process.env.STRIPE_ACCOUNT_WEBHOOK_SECRET!,
  },
});
```

> **Note:** All exposed actions (`store`, `sync`) are **internal**. They can only be called from other Convex functions. Wrap them in public actions when needed.

> **Important:** `store` must always be exported from the same file, as it is used internally by the library to persist webhook data.

### 5. Register HTTP Routes

Register the Stripe webhook and redirect routes on your Convex HTTP router. This sets up two routes:

- `POST /stripe/webhook` to receive and verify Stripe webhook events.
- `GET /stripe/return/*` to handle post-checkout and post-portal redirect flows.

```ts
// convex/http.ts

import { httpRouter } from "convex/server";
import { stripe } from "./stripe";

const http = httpRouter();

stripe.addHttpRoutes(http);

export default http;
```

### 6. Stripe Customers

Create a Stripe customer the moment a new entity (user, organization, etc.) is created in your app. An `entityId` is your app's internal identifier for the thing you are billing. Each entity must be associated with exactly one Stripe customer.

The customer can be created using `stripe.customers.create`. Below are examples using different auth providers, where the user is the entity being billed.

::: code-group

```ts [convex-auth]
// convex/auth.ts

// example with convex-auth: https://labs.convex.dev/auth

import { convexAuth } from "@convex-dev/auth/server";
import { Password } from "@convex-dev/auth/providers/Password";
import { internal } from "./_generated/api";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [Password],
  callbacks: {
    // NOTE: create a customer immediately after a user is created
    afterUserCreatedOrUpdated: async (context, args) => {
      await context.scheduler.runAfter(0, internal.stripe.createCustomer, {
        entityId: args.userId,
        email: args.profile.email,
      });
    },
  },
});
```

```ts [better-auth]
// convex/auth.ts

// example with better-auth: https://convex-better-auth.netlify.app/

// coming soon...
```

```ts [clerk]
// convex/auth.ts

// example with clerk: https://docs.convex.dev/auth/clerk

// coming soon...
```

:::

When using the example above, you also need to export the `createCustomer` action from your Stripe file:

```ts
// convex/stripe.ts

import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import { stripe } from "./stripe";

export const createCustomer = internalAction({
  args: {
    email: v.optional(v.string()),
    entityId: v.string(),
  },
  handler: async (context, args) => {
    return stripe.customers.create(context, {
      email: args.email,
      entityId: args.entityId,
    });
  },
});
```

### 7. Run the `sync` Action

In your Convex project's dashboard, go to the **Functions** section and execute the `sync` action with `{ tables: true }`.

This syncs already existing Stripe data (products, prices, customers, subscriptions, etc.) into your Convex database. It must be done in both your development and production deployments after installing or updating the library.

This step is not necessary if you are starting with a fresh, empty Stripe account.

### 8. Start Building

With everything set up, you can now use the provided functions to:

- Create subscription checkout sessions: [`stripe.subscribe`](#stripesubscribe).
- Create one time payment checkout sessions: [`stripe.pay`](#stripepay).
- Open the Stripe Billing Portal for an entity: [`stripe.portal`](#stripeportal).
- Create Stripe Connect accounts: [`stripe.accounts.create`](#stripeaccountscreate).
- Generate onboarding links for connected accounts: [`stripe.accounts.link`](#stripeaccountslink).
- Query any of the [synced tables](#synced-tables) directly in your Convex functions.

## Configuration

The `internalConvexStripe` function accepts a configuration object and an optional options object.

```ts
const { stripe, store, sync } = internalConvexStripe(configuration, options);
```
### Schema Configuration

The `schema` key holds your convex app schema, from it the package will infer which stripe tables should be synced or not depending on what stripeTables where defined.

### Stripe Configuration

The `stripe` key in the configuration object holds your Stripe credentials and API settings.

| Property                 | Type     | Required | Description                                                                             |
| :----------------------- | :------- | :------- | :-------------------------------------------------------------------------------------- |
| `secret_key`             | `string` | Yes      | Your Stripe secret key (starts with `sk_`).                                             |
| `account_webhook_secret` | `string` | Yes      | The webhook signing secret for account level webhooks (starts with `whsec_`).           |
| `connect_webhook_secret` | `string` | No       | The webhook signing secret for Stripe Connect webhooks. Required only if using Connect. |
| `version`                | `string` | No       | Stripe API version to pin against. Defaults to `2025-08-27.basil`.                      |

### Sync Configuration

The `sync` key controls which tables are synced and allows you to define catalog items, webhook endpoints, and billing portal configuration.

#### Catalog (Unstable)

The `sync.catalog` key lets you pre-define products and prices that should exist in Stripe. When the `sync` action is called with `{ catalog: true }`, the library ensures these objects exist in your Stripe account.

```ts
internalConvexStripe({
  // ...
  sync: {
    catalog: {
      products: [
        { name: "Pro Plan", metadata: { convex_stripe_key: "pro" } },
      ],
      prices: [
        {
          currency: "usd",
          unit_amount: 1999,
          recurring: { interval: "month" },
          product_data: { name: "Pro Plan", metadata: { convex_stripe_key: "pro" } },
          metadata: { convex_stripe_key: "pro-monthly" },
        },
      ],
      metadataKey: "convex_stripe_key", // default
      behavior: {
        onExisting: "update",   // "update" | "archive_and_recreate" | "skip" | "error"
        onMissingKey: "create", // "create" | "error"
      },
    },
  },
});
```

#### Webhook Configuration

The `sync.webhooks` key lets you customize the metadata and description of the webhook endpoints that the library creates when you call `sync` with `{ webhooks: { account: true } }` or `{ webhooks: { connect: true } }`.

```ts
{
  sync: {
    webhooks: {
      account: {
        description: "My App - Account Webhook",
        metadata: { app: "my-app" },
      },
      connect: {
        description: "My App - Connect Webhook",
        metadata: { app: "my-app" },
      },
    },
  },
}
```

#### Portal Configuration

The `sync.portal` key accepts a `Stripe.BillingPortal.ConfigurationCreateParams` object. When `sync` is called with `{ portal: true }`, the library creates the billing portal configuration if it does not already exist.

### Callbacks

The `callbacks.afterChange` function is called every time a row is inserted, upserted, or deleted in any of the synced Stripe tables. This is useful for triggering side effects when Stripe data changes.

```ts
internalConvexStripe({
  // ...
  callbacks: {
    afterChange: async (context, operation, event) => {
      // operation: "upsert" | "delete" | "insert"
      // event.table: the name of the table that changed (e.g. "stripeSubscriptions")
      console.log(`Stripe data changed: ${operation} on ${event.table}`);
    },
  },
});
```

### Custom Webhook Handlers

You can register additional webhook handlers to react to specific Stripe events beyond the default syncing behavior. Use `defineWebhookHandler` to create a handler:

```ts
import { defineWebhookHandler } from "@raideno/convex-stripe/server";

const myHandler = defineWebhookHandler({
  events: ["invoice.payment_succeeded"],
  handle: async (event, context, configuration, options) => {
    // react to the event
  },
});

internalConvexStripe({
  // ...
  webhook: {
    handlers: [myHandler],
  },
});
```

### Custom Redirect Handlers

Redirect handlers let you run custom logic when a user is redirected back from Stripe (after a checkout, portal session, or account link flow). Use `defineRedirectHandler` to create one:

```ts
import { defineRedirectHandler } from "@raideno/convex-stripe/server";

const myRedirectHandler = defineRedirectHandler({
  origins: ["subscribe-success", "pay-success"],
  handle: async (origin, context, data, configuration, options) => {
    // run custom logic after a successful payment or subscription
  },
});

internalConvexStripe({
  // ...
  redirect: {
    ttlMs: 15 * 60 * 1000, // default: 15 minutes
    handlers: [myRedirectHandler],
  },
});
```

The available redirect origins are:

| Origin                        | Trigger                                           |
| :---------------------------- | :------------------------------------------------ |
| `subscribe-success`           | User completed a subscription checkout.           |
| `subscribe-cancel`            | User cancelled a subscription checkout.           |
| `pay-success`                 | User completed a one time payment checkout.       |
| `pay-cancel`                  | User cancelled a one time payment checkout.       |
| `portal-return`               | User returned from the billing portal.            |
| `create-account-link-return`  | Connected account completed onboarding.           |
| `create-account-link-refresh` | Connected account link expired and needs refresh. |

#### `buildSignedReturnUrl`

The library also exports a `buildSignedReturnUrl` utility that you can use to manually build signed redirect URLs. This is the same function used internally by `stripe.subscribe`, `stripe.pay`, `stripe.portal`, and `stripe.accounts.link` to generate their `success_url`, `cancel_url`, and `return_url` values.

Each signed URL points to `GET /stripe/return/<origin>` on your Convex backend, carries an HMAC-SHA256 signature derived from your `account_webhook_secret`, and expires after the configured `redirect.ttlMs` (default: 15 minutes). When the user hits the URL, the library verifies the signature, checks expiry, runs any matching redirect handler, and then issues a 302 redirect to the `targetUrl` you specified. If verification fails or the link has expired, the user is redirected to your `failureUrl` instead (if provided).

```ts
import { buildSignedReturnUrl } from "@raideno/convex-stripe/server";

const url = await buildSignedReturnUrl({
  configuration,         // your InternalConfiguration object
  origin: "pay-success", // one of the redirect origins listed above
  targetUrl: "https://example.com/payments/success",
  failureUrl: "https://example.com/payments/error", // optional
  data: {
    entityId: "user_123",
    referenceId: "order_456",
    // data fields depend on the origin
  },
});
```

You typically do not need to call this function directly, as the built-in actions already handle URL signing for you. It is useful when building custom checkout or redirect flows outside of the provided actions.

### Options

The second argument to `internalConvexStripe` is an optional options object.

```ts
const { stripe, store, sync } = internalConvexStripe(configuration, {
  debug: true,   // enable debug logging
  base: "stripe", // base path for HTTP routes (default: "stripe")
  store: "store", // name of the store mutation export (default: "store")
});
```

## Stripe Connect

If you want to build a marketplace or platform with Stripe Connect, follow these additional steps after completing the [Usage](#usage) setup.

### 0. Enable Connect on your Stripe dashboard.

Go to the [Stripe Connect settings](https://dashboard.stripe.com/test/settings/connect) and enable Connect for your account.

### 1. Create a Connect webhook using the `sync` action.

Run the `sync` action from your Convex dashboard with the following arguments:

```json
{
  "tables": true,
  "webhooks": {
    "connect": true
  }
}
```

This creates a Connect webhook endpoint on your Stripe account. The webhook secret will be printed in the Convex function logs.

### 2. Add the new webhook secret to your Convex environment and configuration.

Set the Connect webhook secret as an environment variable:

```bash
npx convex env set STRIPE_CONNECT_WEBHOOK_SECRET "<secret>"
```

Then update your configuration to include it:

```ts
// convex/stripe.ts

import { internalConvexStripe } from "@raideno/convex-stripe/server";

import schema from "./schema";

export const { stripe, store, sync } = internalConvexStripe({
  schema: schema,
  stripe: {
    secret_key: process.env.STRIPE_SECRET_KEY!,
    account_webhook_secret: process.env.STRIPE_ACCOUNT_WEBHOOK_SECRET!,
    connect_webhook_secret: process.env.STRIPE_CONNECT_WEBHOOK_SECRET!,
  }
});
```

### 3. Create Stripe Accounts for Sellers & Onboard them

Create a connected account for each seller and generate an onboarding link:

```ts
// convex/connect.ts

import { v } from "convex/values";
import { action } from "./_generated/server";
import { stripe } from "./stripe";

export const createSellerAccount = action({
  args: { entityId: v.string(), email: v.string() },
  handler: async (context, args) => {
    // create the connected account
    const account = await stripe.accounts.create(context, {
      entityId: args.entityId,
      email: args.email,
      controller: {
        fees: { payer: "application" },
        losses: { payments: "application" },
        stripe_dashboard: { type: "express" },
      },
    });

    // generate the onboarding link
    const link = await stripe.accounts.link(context, {
      account: account.accountId,
      refresh_url: "http://localhost:3000/connect/refresh",
      return_url: "http://localhost:3000/connect/return",
      type: "account_onboarding",
      collection_options: { fields: "eventually_due" },
    });

    return link.url;
  },
});
```

### 4. Create Products for Sellers

Create products and prices on connected accounts by passing `stripeAccount` in the Stripe request options:

```ts
const product = await stripe.client.products.create(
  { name: "Widget", default_price_data: { currency: "usd", unit_amount: 1000 } },
  { stripeAccount: account.accountId },
);
```

### 5. Send Payouts

Payouts to connected accounts are handled by Stripe automatically based on your Connect payout schedule. You can also create manual transfers using the `stripe.client`:

```ts
const transfer = await stripe.client.transfers.create({
  amount: 1000,
  currency: "usd",
  destination: account.accountId,
});
```

## API Reference

### `stripe.customers.create`

Creates or retrieves a Stripe customer for a given entity. If the entity already has a Stripe customer associated with it, the existing customer is returned instead of creating a duplicate.

This should be called whenever a new entity is created in your app. See [Stripe Customers](#6-stripe-customers) for integration examples.

**Parameters:**

| Parameter  | Type     | Required | Description                                                 |
| :--------- | :------- | :------- | :---------------------------------------------------------- |
| `entityId` | `string` | Yes      | Your app's internal identifier for the entity being billed. |
| `email`    | `string` | No       | Email address for the Stripe customer. Recommended.         |
| `metadata` | `object` | No       | Additional metadata to attach to the Stripe customer.       |

All other parameters from [`Stripe.CustomerCreateParams`](https://docs.stripe.com/api/customers/create) are also accepted.

**Returns:** The Stripe customer document from your Convex database.

```ts
const customer = await stripe.customers.create(context, {
  entityId: args.entityId,
  email: args.email,
});
```

### `stripe.subscribe`

Creates a Stripe Checkout session in `subscription` mode. Calls [`stripe.checkout.sessions.create`](https://docs.stripe.com/api/checkout/sessions/create) under the hood.

**Parameters:**

| Parameter                       | Type             | Required | Description                                                                                        |
| :------------------------------ | :--------------- | :------- | :------------------------------------------------------------------------------------------------- |
| `entityId`                      | `string`         | Yes      | Your app's internal identifier for the entity subscribing.                                         |
| `priceId`                       | `string`         | Yes      | The Stripe Price ID for the subscription.                                                          |
| `mode`                          | `"subscription"` | Yes      | Must be `"subscription"`.                                                                          |
| `success_url`                   | `string`         | Yes      | URL to redirect to after a successful checkout.                                                    |
| `cancel_url`                    | `string`         | Yes      | URL to redirect to if the user cancels.                                                            |
| `failure_url`                   | `string`         | No       | URL to redirect to if the redirect signing fails.                                                  |
| `createStripeCustomerIfMissing` | `boolean`        | No       | If `true` (default), creates a Stripe customer automatically if one does not exist for the entity. |

All other parameters from [`Stripe.Checkout.SessionCreateParams`](https://docs.stripe.com/api/checkout/sessions/create) (except `customer`, `ui_mode`, `mode`, `line_items`, `client_reference_id`, `success_url`, `cancel_url`) are also accepted.

An optional third argument accepts [`Stripe.RequestOptions`](https://docs.stripe.com/api/request_options) (e.g. `stripeAccount` for Connect).

**Returns:** A [`Stripe.Checkout.Session`](https://docs.stripe.com/api/checkout/sessions/object). Use the `url` property to redirect the user.

```ts
export const createSubscription = action({
  args: { entityId: v.string(), priceId: v.string() },
  handler: async (context, args) => {
    const response = await stripe.subscribe(context, {
      entityId: args.entityId,
      priceId: args.priceId,
      mode: "subscription",
      success_url: "https://example.com/payments/success",
      cancel_url: "https://example.com/payments/cancel",
    });

    return response.url;
  },
});
```

### `stripe.pay`

Creates a Stripe Checkout session in `payment` mode for one time payments. Calls [`stripe.checkout.sessions.create`](https://docs.stripe.com/api/checkout/sessions/create) under the hood.

**Parameters:**

| Parameter                       | Type        | Required | Description                                                                                                               |
| :------------------------------ | :---------- | :------- | :------------------------------------------------------------------------------------------------------------------------ |
| `entityId`                      | `string`    | Yes      | Your app's internal identifier for the entity making the payment.                                                         |
| `referenceId`                   | `string`    | Yes      | Your app's reference ID for this payment (e.g. an order ID). Stored as the `client_reference_id` on the checkout session. |
| `mode`                          | `"payment"` | Yes      | Must be `"payment"`.                                                                                                      |
| `line_items`                    | `array`     | Yes      | The line items for the checkout session (price, quantity, etc.).                                                          |
| `success_url`                   | `string`    | Yes      | URL to redirect to after a successful payment.                                                                            |
| `cancel_url`                    | `string`    | Yes      | URL to redirect to if the user cancels.                                                                                   |
| `failure_url`                   | `string`    | No       | URL to redirect to if the redirect signing fails.                                                                         |
| `createStripeCustomerIfMissing` | `boolean`   | No       | If `true` (default), creates a Stripe customer automatically if one does not exist for the entity.                        |

All other parameters from [`Stripe.Checkout.SessionCreateParams`](https://docs.stripe.com/api/checkout/sessions/create) (except `customer`, `ui_mode`, `mode`, `client_reference_id`, `success_url`, `cancel_url`) are also accepted.

An optional third argument accepts [`Stripe.RequestOptions`](https://docs.stripe.com/api/request_options).

**Returns:** A [`Stripe.Checkout.Session`](https://docs.stripe.com/api/checkout/sessions/object). Use the `url` property to redirect the user.

```ts
export const createPayment = action({
  args: { entityId: v.string(), orderId: v.string(), priceId: v.string() },
  handler: async (context, args) => {
    const response = await stripe.pay(context, {
      referenceId: args.orderId,
      entityId: args.entityId,
      mode: "payment",
      line_items: [{ price: args.priceId, quantity: 1 }],
      success_url: `${process.env.SITE_URL}/payments/success`,
      cancel_url: `${process.env.SITE_URL}/payments/cancel`,
    });

    return response.url;
  },
});
```

### `stripe.portal`

Opens a Stripe Billing Portal session for an existing customer. Allows users to manage their subscriptions, invoices, and payment methods. Calls [`stripe.billingPortal.sessions.create`](https://docs.stripe.com/api/customer_portal/sessions/create) under the hood.

**Parameters:**

| Parameter                       | Type      | Required | Description                                                                                        |
| :------------------------------ | :-------- | :------- | :------------------------------------------------------------------------------------------------- |
| `entityId`                      | `string`  | Yes      | Your app's internal identifier for the entity.                                                     |
| `return_url`                    | `string`  | Yes      | URL to redirect to when the user leaves the portal.                                                |
| `failure_url`                   | `string`  | No       | URL to redirect to if the redirect signing fails.                                                  |
| `createStripeCustomerIfMissing` | `boolean` | No       | If `true` (default), creates a Stripe customer automatically if one does not exist for the entity. |

All other parameters from [`Stripe.BillingPortal.SessionCreateParams`](https://docs.stripe.com/api/customer_portal/sessions/create) (except `customer` and `return_url`) are also accepted.

An optional third argument accepts [`Stripe.RequestOptions`](https://docs.stripe.com/api/request_options).

**Returns:** A [`Stripe.BillingPortal.Session`](https://docs.stripe.com/api/customer_portal/sessions/object). Use the `url` property to redirect the user.

```ts
export const openPortal = action({
  args: { entityId: v.string() },
  handler: async (context, args) => {
    const response = await stripe.portal(context, {
      entityId: args.entityId,
      return_url: "https://example.com/account",
    });

    return response.url;
  },
});
```

### `stripe.accounts.create`

Creates a new Stripe Connect account and stores it in your Convex database. If an account already exists for the given entity, the existing account is returned.

**Parameters:**

| Parameter  | Type     | Required | Description                                                    |
| :--------- | :------- | :------- | :------------------------------------------------------------- |
| `entityId` | `string` | Yes      | Your app's internal identifier for the seller/platform entity. |

All other parameters from [`Stripe.AccountCreateParams`](https://docs.stripe.com/api/accounts/create) (except `type`) are also accepted.

An optional third argument accepts [`Stripe.RequestOptions`](https://docs.stripe.com/api/request_options).

**Returns:** The Stripe account document from your Convex database.

```ts
const account = await stripe.accounts.create(context, {
  entityId: args.entityId,
  email: args.email,
  controller: {
    fees: { payer: "application" },
    losses: { payments: "application" },
    stripe_dashboard: { type: "express" },
  },
});
```

### `stripe.accounts.link`

Creates a Stripe Connect Account Link for onboarding. Redirects the connected account holder to Stripe's hosted onboarding flow.

**Parameters:**

| Parameter     | Type     | Required | Description                                         |
| :------------ | :------- | :------- | :-------------------------------------------------- |
| `account`     | `string` | Yes      | The Stripe Account ID to onboard (e.g. `acct_...`). |
| `refresh_url` | `string` | Yes      | URL to redirect to if the link expires.             |
| `return_url`  | `string` | Yes      | URL to redirect to after onboarding is complete.    |
| `failure_url` | `string` | No       | URL to redirect to if the redirect signing fails.   |

All other parameters from [`Stripe.AccountLinkCreateParams`](https://docs.stripe.com/api/account_links/create) (except `refresh_url` and `return_url`) are also accepted.

An optional third argument accepts [`Stripe.RequestOptions`](https://docs.stripe.com/api/request_options).

**Returns:** A [`Stripe.AccountLink`](https://docs.stripe.com/api/account_links/object). Use the `url` property to redirect the user.

```ts
const link = await stripe.accounts.link(context, {
  account: account.accountId,
  refresh_url: "https://example.com/connect/refresh",
  return_url: "https://example.com/connect/return",
  type: "account_onboarding",
  collection_options: { fields: "eventually_due" },
});
```

### `stripe.addHttpRoutes`

Registers the Stripe webhook and redirect routes on your Convex HTTP router. Call this inside your `convex/http.ts` file.

Registers two routes:
- `POST /stripe/webhook` receives and verifies Stripe webhook events.
- `GET /stripe/return/*` handles post-checkout and post-portal redirect flows.

```ts
const http = httpRouter();
stripe.addHttpRoutes(http);
export default http;
```

### `stripe.client`

A pre-configured [Stripe SDK](https://docs.stripe.com/api) client using your `secret_key` and API `version`. Use this for any Stripe API call not covered by the library's built-in functions.

```ts
const product = await stripe.client.products.create({
  name: "New Product",
  default_price_data: { currency: "usd", unit_amount: 999 },
});
```

### `sync` Action

An internal action that synchronizes Stripe resources with your Convex database.

This action is typically called manually from the Convex dashboard, or set up to be called automatically in your CI/CD pipeline on each deployment.

**Parameters:**

| Parameter  | Type                                       | Required | Description                                                                                                                                                                                                                          |
| :--------- | :----------------------------------------- | :------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tables`   | `boolean \| { withConnect: boolean }`      | Yes      | If `true`, syncs all existing Stripe resources to Convex tables. If an object with `withConnect: true`, also syncs resources from linked connected accounts.                                                                         |
| `webhooks` | `{ account?: boolean, connect?: boolean }` | No       | If `account` is `true`, creates or updates the account webhook endpoint. If `connect` is `true`, creates or updates the Connect webhook endpoint. The webhook secret is printed to the function logs when a new endpoint is created. |
| `portal`   | `boolean`                                  | No       | If `true`, creates the default billing portal configuration if it does not already exist.                                                                                                                                            |
| `catalog`  | `boolean`                                  | No       | If `true`, creates or updates the products and prices defined in your `sync.catalog` configuration.                                                                                                                                  |

### `store` Mutation

An internal mutation that persists Stripe objects into your Convex database. This is called automatically from within the webhook handler and is not meant for direct use. It must be exported from the same file as your `internalConvexStripe` call.

### `stripe.helpers`

Returns a set of pre-built, authorization-aware Convex functions that cover the most common Stripe operations. These are ready to export and call from your frontend directly — no boilerplate required.

Each returned function invokes your `authenticateAndAuthorize` callback to resolve the caller's identity before delegating to the underlying Stripe implementation. When a caller omits `entityId`, it means they want to act on themselves — your callback is responsible for deriving their identity from the Convex `context`.

stripe.helpers({
  authenticateAndAuthorize: async ({ context, operation, entityId }) => {
    // Return [isAuthorized, resolvedEntityId | null]
  }
})
```

**`authenticateAndAuthorize` parameters (passed as a single object):**

| Parameter   | Type                                                                                                 | Description                                                                                                                                                                                                            |
| :---------- | :--------------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `context`   | `GenericActionCtx<any>` or `GenericQueryCtx<any>`                                                    | The Convex context, **narrowed by `operation`**: action ops (`createCustomer`, `subscribe`, `pay`, `portal`) receive `GenericActionCtx`; query ops (`products`, `subscription`, `customer`) receive `GenericQueryCtx`. |
| `operation` | `"createCustomer" \| "subscribe" \| "pay" \| "products" \| "subscription" \| "customer" \| "portal"` | The operation being performed.                                                                                                                                                                                         |
| `entityId`  | `string \| undefined`                                                                                | The entity ID passed by the caller, or `undefined` if acting on themselves.                                                                                                                                            |

**Returns:** `Promise<[boolean, string | null]>` — `[isAuthorized, entityId]`.

**Returned functions:**

| Name             | Kind             | Description                                  |
| :--------------- | :--------------- | :------------------------------------------- |
| `createCustomer` | `internalAction` | Create a Stripe customer for a given entity. |
| `products`       | `query`          | List all synced products with their prices.  |
| `subscription`   | `query`          | Get the entity's active subscription.        |
| `customer`       | `query`          | Get the entity's Stripe customer record.     |

## Pre-built Helper Functions

`stripe.helpers()` is the fastest way to add Stripe to your app. Instead of hand-writing each Convex function, call `stripe.helpers()` once and export the returned functions:

```ts
// convex/stripe.ts
import { getAuthUserId } from "@convex-dev/auth/server";
import { internalConvexStripe } from "@raideno/convex-stripe/server";
import type { HelperAuthCallback } from "@raideno/convex-stripe/server";
import schema from "./schema";

export const { stripe, store, sync } = internalConvexStripe({
  schema,
  stripe: {
    secret_key: process.env.STRIPE_SECRET_KEY!,
    account_webhook_secret: process.env.STRIPE_ACCOUNT_WEBHOOK_SECRET!,
  },
});

// A single callback that authenticates every helper function.
// `context` is automatically typed as GenericActionCtx or GenericQueryCtx
// depending on which `operation` is being executed.
const authenticateAndAuthorize: HelperAuthCallback = async ({
  context,   // GenericActionCtx<any> or GenericQueryCtx<any>
  operation,
  entityId,
}) => {
  // For product listings there is no specific entity — allow everyone.
  if (operation === "products") return [true, null];

  const userId = await getAuthUserId(context);
  if (!userId) return [false, null];

  // If the caller passed an explicit entityId, use it; otherwise they act on themselves.
  return [true, entityId ?? userId];
};

export const {
  createCustomer,
  products,
  subscription,
  customer,
} = stripe.helpers({
  authenticateAndAuthorize
});
```

Then register `createCustomer` with your auth callbacks (the same way as the manual approach), and call the rest from your frontend:

```ts
// frontend
const items     = await convex.query(api.stripe.products, {});
const sub       = await convex.query(api.stripe.subscription, {});
const me        = await convex.query(api.stripe.customer, {});

// Return URLs are handled by helper config, so frontend calls stay clean.
const { url }   = await convex.action(api.stripe.subscribe, {
  priceId: "price_xxx",
});

const { url }   = await convex.action(api.stripe.pay, {
  referenceId: "order_123",
  line_items: [{ price: "price_yyy", quantity: 1 }],
});

const { url }   = await convex.action(api.stripe.portal, {});
```

### `helpers.createCustomer`

An **internal** Convex action that creates a Stripe customer for the given `entityId`. Designed to be called from auth lifecycle callbacks (e.g. `afterUserCreatedOrUpdated`), not from the frontend directly.

**Arguments:**

| Parameter  | Type     | Required | Description                                         |
| :--------- | :------- | :------- | :-------------------------------------------------- |
| `entityId` | `string` | Yes      | Your app's internal identifier for the entity.      |
| `email`    | `string` | No       | Email address to set on the Stripe customer record. |

**Returns:** The Stripe customer document from your Convex database.

### `helpers.products`

A **public** Convex query that returns all synced Stripe products with their associated prices nested inside.

**Arguments:** none

**Returns:** An array of product documents from `stripeProducts`, each with a `prices` field containing all related entries from `stripePrices`.

### `helpers.subscription`

A **public** Convex query that returns the active Stripe subscription for the authenticated entity, or `null` if they have no subscription.

**Arguments:**

| Parameter  | Type     | Required | Description                                   |
| :--------- | :------- | :------- | :-------------------------------------------- |
| `entityId` | `string` | No       | Override the entity (defaults to the caller). |

**Returns:** The subscription document from `stripeSubscriptions`, or `null`.

### `helpers.customer`

A **public** Convex query that returns the Stripe customer record for the authenticated entity, or `null` if they have no customer yet.

**Arguments:**

| Parameter  | Type     | Required | Description                                   |
| :--------- | :------- | :------- | :-------------------------------------------- |
| `entityId` | `string` | No       | Override the entity (defaults to the caller). |

**Returns:** The customer document from `stripeCustomers`, or `null`.

## Synced Tables

The library automatically syncs the following 24 Stripe resource types into your Convex database:

| Table                               | ID Field                       | Description                   |
| :---------------------------------- | :----------------------------- | :---------------------------- |
| `stripeAccounts`                    | `accountId`                    | Connected accounts            |
| `stripeProducts`                    | `productId`                    | Products                      |
| `stripePrices`                      | `priceId`                      | Prices                        |
| `stripeCustomers`                   | `customerId`                   | Customers                     |
| `stripeSubscriptions`               | `subscriptionId`               | Subscriptions                 |
| `stripeCoupons`                     | `couponId`                     | Coupons                       |
| `stripePromotionCodes`              | `promotionCodeId`              | Promotion codes               |
| `stripePayouts`                     | `payoutId`                     | Payouts                       |
| `stripeRefunds`                     | `refundId`                     | Refunds                       |
| `stripePaymentIntents`              | `paymentIntentId`              | Payment intents               |
| `stripeCheckoutSessions`            | `checkoutSessionId`            | Checkout sessions             |
| `stripeInvoices`                    | `invoiceId`                    | Invoices                      |
| `stripeReviews`                     | `reviewId`                     | Reviews                       |
| `stripePlans`                       | `planId`                       | Plans                         |
| `stripeDisputes`                    | `disputeId`                    | Disputes                      |
| `stripeEarlyFraudWarnings`          | `earlyFraudWarningId`          | Early fraud warnings          |
| `stripeTaxIds`                      | `taxIdId`                      | Tax IDs                       |
| `stripeSetupIntents`                | `setupIntentId`                | Setup intents                 |
| `stripeCreditNotes`                 | `creditNoteId`                 | Credit notes                  |
| `stripeCharges`                     | `chargeId`                     | Charges                       |
| `stripePaymentMethods`              | `paymentMethodId`              | Payment methods               |
| `stripeSubscriptionSchedules`       | `subscriptionScheduleId`       | Subscription schedules        |
| `stripeMandates`                    | `mandateId`                    | Mandates                      |
| `stripeBillingPortalConfigurations` | `billingPortalConfigurationId` | Billing portal configurations |
| `stripeTransfers`                   | `transferId`                   | Transfers                     |
| `stripeCapabilities`                | `capabilityId`                 | Capabilities                  |

Each table stores the full Stripe object in a `stripe` field and includes a `lastSyncedAt` timestamp. All tables have a `byStripeId` index on their ID field. Tables with an `accountId` field also have a `byAccountId` index for filtering by connected account.

For the full schema of each table, see [Tables Reference](./documentation/references/tables.md).

## Synced Events

The library handles a large number of Stripe webhook events to keep your local data in sync. Below is a summary by resource type. For the full list, see [Events Reference](./documentation/references/events.md).

| Resource               | Events                                                                                     |
| :--------------------- | :----------------------------------------------------------------------------------------- |
| Subscriptions          | `customer.subscription.created`, `updated`, `deleted`, `paused`, `resumed`, etc.           |
| Checkout Sessions      | `checkout.session.completed`, `expired`, `async_payment_succeeded`, `async_payment_failed` |
| Customers              | `customer.created`, `updated`, `deleted`                                                   |
| Invoices               | `invoice.created`, `paid`, `payment_failed`, `finalized`, `voided`, etc.                   |
| Payment Intents        | `payment_intent.created`, `succeeded`, `canceled`, `payment_failed`, etc.                  |
| Products               | `product.created`, `updated`, `deleted`                                                    |
| Prices                 | `price.created`, `updated`, `deleted`                                                      |
| Charges                | `charge.captured`, `succeeded`, `failed`, `refunded`, etc.                                 |
| Refunds                | `refund.created`, `updated`, `failed`                                                      |
| Payouts                | `payout.created`, `paid`, `failed`, `canceled`, etc.                                       |
| Disputes               | `charge.dispute.created`, `updated`, `closed`, etc.                                        |
| Payment Methods        | `payment_method.attached`, `detached`, `updated`, etc.                                     |
| Setup Intents          | `setup_intent.created`, `succeeded`, `canceled`, `setup_failed`, etc.                      |
| Coupons                | `coupon.created`, `updated`, `deleted`                                                     |
| Promotion Codes        | `promotion_code.created`, `updated`                                                        |
| Credit Notes           | `credit_note.created`, `updated`, `voided`                                                 |
| Reviews                | `review.opened`, `closed`                                                                  |
| Plans                  | `plan.created`, `updated`, `deleted`                                                       |
| Tax IDs                | `customer.tax_id.created`, `updated`, `deleted`                                            |
| Early Fraud Warnings   | `radar.early_fraud_warning.created`, `updated`                                             |
| Subscription Schedules | `subscription_schedule.created`, `updated`, `canceled`, `completed`, etc.                  |

## Best Practices

- Always create a Stripe customer (`stripe.customers.create`) the moment a new entity is created in your app. This ensures every user or organization has a Stripe customer ready for billing.
- Use `metadata` or `marketing_features` on Stripe products to store feature flags or usage limits. You can then query the synced `stripeProducts` table to check entitlements.
- Run the `sync` action when you first configure the library, and after each deployment, to ensure your local database is up to date with Stripe.
- Never expose internal actions directly to clients. Always wrap them in public actions with proper authentication and authorization checks.
- Keep your webhook secrets secure. Never commit them to source control. Always use Convex environment variables.

## Resources

- [Convex Documentation](https://docs.convex.dev)
- [Stripe Documentation](https://stripe.com/docs)
- [GitHub Repository](https://github.com/raideno/convex-stripe)
- [Theo's Stripe Recommendations](https://github.com/t3dotgg/stripe-recommendations)

## Development

Clone the repository:

```bash
git clone git@github.com:raideno/convex-stripe.git
cd convex-stripe
```

Install the dependencies:

```bash
npm install
```

Start the development server:

```bash
# automatically rebuild lib on changes
npm run dev --workspace @raideno/convex-stripe
# run the demo app
npm run dev --workspace demo
```

## Contributions

All contributions are welcome. Please open an issue or a pull request.
