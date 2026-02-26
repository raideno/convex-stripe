import { v } from "convex/values";

import { defineActionImplementation } from "@/helpers";
import Stripe from "stripe";

import { AccountsSyncImplementation } from "./handlers/accounts.handler";
import { BillingPortalConfigurationsSyncImplementation } from "./handlers/billing-portal-configurations.handler";
import { CapabilitiesSyncImplementation } from "./handlers/capabilities.handler";
import { ChargesSyncImplementation } from "./handlers/charges.handler";
import { CheckoutSessionsSyncImplementation } from "./handlers/checkout-sessions.handler";
import { CouponsSyncImplementation } from "./handlers/coupons.handler";
import { CreditNotesSyncImplementation } from "./handlers/credit-notes.handler";
import { CustomersSyncImplementation } from "./handlers/customers.handler";
import { DisputesSyncImplementation } from "./handlers/disputes.handler";
import { EarlyFraudWarningsSyncImplementation } from "./handlers/early-fraud-warnings.handler";
import { InvoicesSyncImplementation } from "./handlers/invoices.handler";
import { PaymentIntentsSyncImplementation } from "./handlers/payment-intents.handler";
import { PaymentMethodsSyncImplementation } from "./handlers/payment-methods.handler";
import { PayoutsSyncImplementation } from "./handlers/payouts.handler";
import { PlansSyncImplementation } from "./handlers/plans.handler";
import { PricesSyncImplementation } from "./handlers/prices.handler";
import { ProductsSyncImplementation } from "./handlers/products.handler";
import { PromotionCodesSyncImplementation } from "./handlers/promotion-codes.handler";
import { RefundsSyncImplementation } from "./handlers/refunds.handler";
import { ReviewsSyncImplementation } from "./handlers/reviews.handler";
import { SetupIntentsSyncImplementation } from "./handlers/setup-intents.handler";
import { SubscriptionSchedulesSyncImplementation } from "./handlers/subscription-schedules.handler";
import { SubscriptionsSyncImplementation } from "./handlers/subscriptions.handler";
import { TaxIdsSyncImplementation } from "./handlers/tax-id.handler";
import { TransfersSyncImplementation } from "./handlers/transfers.handler";

export const SYNC_HANDLERS = [
  AccountsSyncImplementation,
  BillingPortalConfigurationsSyncImplementation,
  CapabilitiesSyncImplementation,
  ChargesSyncImplementation,
  CheckoutSessionsSyncImplementation,
  CouponsSyncImplementation,
  CreditNotesSyncImplementation,
  CustomersSyncImplementation,
  DisputesSyncImplementation,
  EarlyFraudWarningsSyncImplementation,
  InvoicesSyncImplementation,
  PaymentIntentsSyncImplementation,
  PaymentMethodsSyncImplementation,
  PayoutsSyncImplementation,
  PlansSyncImplementation,
  PricesSyncImplementation,
  ProductsSyncImplementation,
  PromotionCodesSyncImplementation,
  RefundsSyncImplementation,
  ReviewsSyncImplementation,
  SetupIntentsSyncImplementation,
  SubscriptionSchedulesSyncImplementation,
  SubscriptionsSyncImplementation,
  TaxIdsSyncImplementation,
  TransfersSyncImplementation,
] as const;

if (
  SYNC_HANDLERS.some(
    (handler) => !["handler", "name"].every((key) => key in handler),
  )
)
  throw new Error(
    "Each sync handler file should export a valid implementation",
  );

export const SyncTablesImplementation = defineActionImplementation({
  args: v.object({
    withConnect: v.optional(v.boolean()),
  }),
  name: "syncTables",
  handler: async (context, args, configuration, options) => {
    if (!args.withConnect) {
      await Promise.all(
        SYNC_HANDLERS.map(async (handler) => {
          try {
            await handler.handler(
              context,
              {
                accountId: undefined,
              },
              configuration,
              options,
            );
            console.info(`[STRIPE SYNC ${handler.name}](Success)`);
          } catch (error) {
            options.logger.error(
              `[STRIPE SYNC ${handler.name}](Error): ${error}`,
            );
          }
        }),
      );
    } else {
      const stripe = new Stripe(configuration.stripe.secret_key, {
        apiVersion: configuration.stripe.version,
      });

      const accounts = await stripe.accounts
        .list({ limit: 100 })
        .autoPagingToArray({ limit: 10_000 });

      const accountIds = [undefined, ...accounts.map((account) => account.id)];

      await Promise.all(
        accountIds.map(async (accountId) => {
          await Promise.all(
            SYNC_HANDLERS.map(async (handler) => {
              try {
                await handler.handler(
                  context,
                  {
                    accountId: accountId,
                  },
                  configuration,
                  options,
                );
                console.info(
                  `[STRIPE SYNC ${handler.name} for account ${accountId}](Success)`,
                );
              } catch (error) {
                options.logger.error(
                  `[STRIPE SYNC ${handler.name} for account ${accountId}](Error): ${error}`,
                );
              }
            }),
          );
        }),
      );
    }
  },
});
