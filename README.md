# Convex Stripe

Stripe [syncing](./references/tables.md), subscriptions, [checkouts](#-checkout-action) and stripe connect for Convex apps. Implemented according to the best practices listed in [Theo's Stripe Recommendations](https://github.com/t3dotgg/stripe-recommendations).

## Installation

```sh [npm]
npm install @raideno/convex-stripe stripe
```

## Configuration

### 1. Set up Stripe  
- Create a Stripe account.  
- Configure a webhook pointing to:  
  ```
  https://<your-convex-app>.convex.site/stripe/webhook
  ```
- Enable the following [Stripe Events](./references/events.md).  
- Enable the [Stripe Billing Portal](https://dashboard.stripe.com/test/settings/billing/portal).

### 2. Set Environment Variables on Convex

```bash
npx convex env set STRIPE_SECRET_KEY "<secret>"
npx convex env set STRIPE_ACCOUNT_WEBHOOK_SECRET "<secret>"
```

### 3. Add tables.

Check [Tables Schemas](./references/tables.md) to know more about the synced tables.

```ts [convex/schema.ts]
import { defineSchema } from "convex/server";
import { stripeTables } from "@raideno/convex-stripe/server";

export default defineSchema({
  ...stripeTables,
  // your other tables...
});
```

### 4. Initialize the library

```ts [convex/stripe.ts]
import { internalConvexStripe } from "@raideno/convex-stripe/server";

export const { stripe, store, sync } = internalConvexStripe({
  stripe: {
    secret_key: process.env.STRIPE_SECRET_KEY!,
    account_webhook_secret: process.env.STRIPE_ACCOUNT_WEBHOOK_SECRET!,
  },
});

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

> **Note:** All exposed actions (store, sync, createEntity) are **internal**. Meaning they can only be called from other convex functions, you can wrap them in public actions when needed.  
> **Important:** `store` must always be exported, as it is used internally.

### 5. Register HTTP routes

```ts [convex/http.ts]
import { httpRouter } from "convex/server";
import { stripe } from "./stripe";

const http = httpRouter();

// registers POST /stripe/webhook
// registers GET /stripe/return/*
stripe.addHttpRoutes(http);

export default http;
```

### 6. Stripe customers

Ideally you want to create a stripe customer the moment a new entity (user, organization, etc) is created.

An `entityId` refers to something you are billing. It can be a user, organization or any other thing. With each entity must be associated a stripe customer and the stripe customer can be created using the [`createEntity` action](#createentity-action).

Below are with different auth providers examples where the user is the entity we are billing.

::: code-group

```ts [convex-auth]
"convex/auth.ts"

// example with convex-auth: https://labs.convex.dev/auth

import { convexAuth } from "@convex-dev/auth/server";
import { Password } from "@convex-dev/auth/providers/Password";
import { internal } from "./_generated/api";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [Password],
  callbacks: {
    afterUserCreatedOrUpdated: async (context, args) => {
      await context.scheduler.runAfter(0, internal.stripe.createCustomer, {
        /*
         * will call stripe.customers.create
         */
        entityId: args.userId,
        email: args.profile.email,
      });
    },
  },
});
```

```ts [better-auth]
"convex/auth.ts"

// example with better-auth: https://convex-better-auth.netlify.app/

// coming soon...
```

```ts [clerk]
"convex/auth.ts"

// example with clerk: https://docs.convex.dev/auth/clerk

// coming soon...
```

:::

### 7. Run `sync` action

In your convex project's dashboard. Go the **Functions** section and execute the `sync` action.

This is done to sync already existing stripe data into your convex database.
It must be done in both your development and production deployments after installing or updating the library.

This might not be necessary if you are starting with a fresh empty stripe project.

### 8. Start building 
Now you can use the provided functions to:
- Generate a subscription or payment link [`stripe.subscribe`](#subscribe-function), [`stripe.pay`](#pay-function) for a given entity.
- Generate a link to the entity's [`stripe.portal`](#portal-function) to manage their subscriptions.
- Create stripe connect accounts and link them, [`stripe.accounts.create`](#), [`stripe.accounts.link`](#).
- Consult the [synced tables](./references/tables.md).
- Etc.


## Usage

The library automatically syncs the [following tables](./references/tables.md).

You can query these tables at any time to:

- List available products/plans and prices.
- Retrieve customers and their `customerId`.
- Check active subscriptions.
- Etc.


### `customers.create` Function

Creates or updates a Stripe customer for a given entity (user or organization). Will call [`stripe.customers.create`](https://docs.stripe.com/api/customers/create) under the hood.

This should be called whenever a new entity is created in your app, or when you want to ensure the entity has a Stripe customer associated with it.

```ts
import { v } from "convex/values";
import { stripe } from "./stripe";
import { action, internal } from "./_generated/api";

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

**Notes:**

- `entityId` is your app’s internal ID (user/org).
- `customerId` is stripe's internal ID.
- `email` is optional, but recommended so the Stripe customer has a contact email.
- If the entity already has a Stripe customer, `createEntity` will return the existing one instead of creating a duplicate.
- Typically, you’ll call this automatically in your user/org creation flow (see [Configuration - 6](#configuration)).


### `sync` Action

Synchronizes Stripe resources with your Convex database.

This action is typically manually called or setup to be automatically called in your ci/cd pipeline.

**Parameters:**

- `data` (optional, default: `true`): Syncs all existing Stripe resources to Convex tables.
- `data.withConnect` (option, default: `false`): Syncs all existing Stripe resources from linked accounts to Convex tables.
- `webhook.account` (optional, default: `false`): Creates/updates the account webhook endpoint. Returns the webhook secret if a new endpoint is created. You must set it in your convex environment variables as `STRIPE_ACCOUNT_WEBHOOK_SECRET`.
- `webhook.connect` (optional, default: `false`): Creates/updates the connect webhook endpoint. Returns the webhook secret if a new endpoint is created. You must set it in your convex environment variables as `STRIPE_CONNECT_WEBHOOK_SECRET`.
- `portal` (optional, default: `false`): Creates the default billing portal configuration if it doesn't exist.
- `unstable_catalog` (optional, default: `false`): Creates the default provided products and prices passed in the configuration.

### `subscribe` Function

Creates a Stripe Subscription Checkout session for a given entity. Will call [`stripe.checkout.sessions.create`](https://docs.stripe.com/api/checkout/sessions/create) under the hood, the same parameters can be passed.

```ts
import { v } from "convex/values";

import { stripe } from "./stripe";
import { action, internal } from "./_generated/api";

export const createCheckout = action({
  args: { entityId: v.string(), priceId: v.string() },
  handler: async (context, args) => {
    // TODO: add your own auth/authorization logic here

    const response = await stripe.subscribe(context, {
      entityId: args.entityId,
      priceId: args.priceId,
      mode: "subscription",
      success_url: "http://localhost:3000/payments/success",
      cancel_url: "http://localhost:3000/payments/cancel",
      /*
       * Other parameters from stripe.checkout.sessions.create(...)
       */
    }, {
      /*
       * Optional Stripe Request Options
       */
    });

    return response.url;
  },
});
```


### `portal` Function

Allows an entity to manage their subscription via the Stripe Portal. Will call [`stripe.billingPortal.sessions.create`](https://docs.stripe.com/api/customer_portal/sessions/create) under the hood, the same parameters can be passed.

```ts
import { v } from "convex/values";

import { stripe } from "./stripe";
import { action, internal } from "./_generated/api";

export const portal = action({
  args: { entityId: v.string() },
  handler: async (context, args) => {
    const response = await stripe.portal(context, {
      entityId: args.entityId,
      returnUrl: "http://localhost:3000/return-from-portal",
      /*
       * Other parameters from stripe.billingPortal.sessions.create(...)
       */
    }, {
      /*
       * Optional Stripe Request Options
       */
    });

    return response.url;
  },
});
```
The provided entityId must have a customerId associated to it otherwise the action will throw an error.


### `pay` Function

Creates a Stripe One Time Payment Checkout session for a given entity. Will call [`stripe.checkout.sessions.create`](https://docs.stripe.com/api/checkout/sessions/create) under the hood, the same parameters can be passed.

```ts
import { v } from "convex/values";

import { stripe } from "./stripe";
import { action, internal } from "./_generated/api";

export const pay = action({
  args: { entityId: v.string(), orderId: v.string(), priceId: v.string() },
  handler: async (context, args) => {
    // Add your own auth/authorization logic here

    const response = await stripe.pay(context, {
      referenceId: args.orderId,
      entityId: args.entityId,
      mode: "payment",
      line_items: [{ price: args.priceId, quantity: 1 }],
      success_url: `${process.env.SITE_URL}/?return-from-pay=success`,
      cancel_url: `${process.env.SITE_URL}/?return-from-pay=cancel`,
      /*
       * Other parameters from stripe.checkout.sessions.create(...)
       */
    }, {
      /*
       * Optional Stripe Request Options
       */
    });

    return response.url;
  },
});
```


## Best Practices

- Always create a Stripe customer (`createEntity`) when a new entity is created.  
- Use `metadata` or `marketing_features` on products to store feature flags or limits.  
- Run `sync` when you first configure the extension to sync already existing stripe resources.  
- Never expose internal actions directly to clients, wrap them in public actions with proper authorization.


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

All contributions are welcome! Please open an issue or a PR.
