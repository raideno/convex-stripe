import {
  DataModelFromSchemaDefinition,
  defineSchema,
  defineTable,
} from "convex/server";
import { v } from "convex/values";

import { AccountSchema } from "@/schema/models/account";
import { BillingPortalConfigurationSchema } from "@/schema/models/billing-portal-configuration";
import { CapabilitySchema } from "@/schema/models/capability";
import { ChargeSchema } from "@/schema/models/charge";
import { CheckoutSessionSchema } from "@/schema/models/checkout-session";
import { CouponSchema } from "@/schema/models/coupon";
import { CreditNoteSchema } from "@/schema/models/credit-note";
import { CustomerSchema } from "@/schema/models/customer";
import { DisputeSchema } from "@/schema/models/dispute";
import { EarlyFraudWarningSchema } from "@/schema/models/early-fraud-warning";
import { InvoiceSchema } from "@/schema/models/invoice";
import { MandateSchema } from "@/schema/models/mandate";
import { PaymentIntentSchema } from "@/schema/models/payment-intent";
import { PaymentMethodSchema } from "@/schema/models/payment-method";
import { PayoutSchema } from "@/schema/models/payout";
import { PlanSchema } from "@/schema/models/plan";
import { PriceSchema } from "@/schema/models/price";
import { ProductSchema } from "@/schema/models/product";
import { PromotionCodeSchema } from "@/schema/models/promotion-code";
import { RefundSchema } from "@/schema/models/refund";
import { ReviewSchema } from "@/schema/models/review";
import { SetupIntentSchema } from "@/schema/models/setup-intent";
import { SubscriptionObject } from "@/schema/models/subscription";
import { SubscriptionScheduleSchema } from "@/schema/models/subscription-schedule";
import { TaxIdSchema } from "@/schema/models/tax-id";
import { TransferSchema } from "@/schema/models/transfer";

export const BY_STRIPE_ID_INDEX_NAME = "byStripeId" as const;

export const stripeTables = {
  stripeAccounts: defineTable({
    accountId: v.string(),
    entityId: v.optional(v.string()),
    stripe: v.object(AccountSchema),
    lastSyncedAt: v.number(),
  })
    .index("byEntityId", ["entityId"])
    .index(BY_STRIPE_ID_INDEX_NAME, ["accountId"]),
  stripeProducts: defineTable({
    productId: v.string(),
    stripe: v.object(ProductSchema),
    lastSyncedAt: v.number(),
    accountId: v.optional(v.string()),
  })
    .index("byAccountId", ["accountId"])
    .index(BY_STRIPE_ID_INDEX_NAME, ["productId"]),
  stripePrices: defineTable({
    priceId: v.string(),
    stripe: v.object(PriceSchema),
    lastSyncedAt: v.number(),
    accountId: v.optional(v.string()),
  })
    .index("byAccountId", ["accountId"])
    .index(BY_STRIPE_ID_INDEX_NAME, ["priceId"]),
  stripeCustomers: defineTable({
    customerId: v.string(),
    entityId: v.optional(v.string()),
    stripe: v.object(CustomerSchema),
    lastSyncedAt: v.number(),
    accountId: v.optional(v.string()),
  })
    .index("byEntityId", ["entityId"])
    .index("byAccountId", ["accountId"])
    .index(BY_STRIPE_ID_INDEX_NAME, ["customerId"]),
  stripeSubscriptions: defineTable({
    subscriptionId: v.union(v.string(), v.null()),
    customerId: v.string(),
    stripe: SubscriptionObject,
    lastSyncedAt: v.number(),
    accountId: v.optional(v.string()),
  })
    .index("byCustomerId", ["customerId"])
    .index("byAccountId", ["accountId"])
    .index(BY_STRIPE_ID_INDEX_NAME, ["subscriptionId"]),
  stripeCoupons: defineTable({
    couponId: v.string(),
    stripe: v.object(CouponSchema),
    lastSyncedAt: v.number(),
    accountId: v.optional(v.string()),
  })
    .index("byAccountId", ["accountId"])
    .index(BY_STRIPE_ID_INDEX_NAME, ["couponId"]),
  stripePromotionCodes: defineTable({
    promotionCodeId: v.string(),
    stripe: v.object(PromotionCodeSchema),
    lastSyncedAt: v.number(),
    accountId: v.optional(v.string()),
  })
    .index("byAccountId", ["accountId"])
    .index(BY_STRIPE_ID_INDEX_NAME, ["promotionCodeId"]),
  stripePayouts: defineTable({
    payoutId: v.string(),
    stripe: v.object(PayoutSchema),
    lastSyncedAt: v.number(),
    accountId: v.optional(v.string()),
  })
    .index("byAccountId", ["accountId"])
    .index(BY_STRIPE_ID_INDEX_NAME, ["payoutId"]),
  stripeRefunds: defineTable({
    refundId: v.string(),
    stripe: v.object(RefundSchema),
    lastSyncedAt: v.number(),
    accountId: v.optional(v.string()),
  })
    .index("byAccountId", ["accountId"])
    .index(BY_STRIPE_ID_INDEX_NAME, ["refundId"]),
  stripePaymentIntents: defineTable({
    paymentIntentId: v.string(),
    stripe: v.object(PaymentIntentSchema),
    lastSyncedAt: v.number(),
    accountId: v.optional(v.string()),
  })
    .index("byAccountId", ["accountId"])
    .index(BY_STRIPE_ID_INDEX_NAME, ["paymentIntentId"]),
  stripeCheckoutSessions: defineTable({
    checkoutSessionId: v.string(),
    stripe: v.object(CheckoutSessionSchema),
    lastSyncedAt: v.number(),
    accountId: v.optional(v.string()),
  })
    .index("byAccountId", ["accountId"])
    .index(BY_STRIPE_ID_INDEX_NAME, ["checkoutSessionId"]),
  stripeInvoices: defineTable({
    invoiceId: v.string(),
    stripe: v.object(InvoiceSchema),
    lastSyncedAt: v.number(),
    accountId: v.optional(v.string()),
  })
    .index("byAccountId", ["accountId"])
    .index(BY_STRIPE_ID_INDEX_NAME, ["invoiceId"]),
  stripeReviews: defineTable({
    reviewId: v.string(),
    stripe: v.object(ReviewSchema),
    lastSyncedAt: v.number(),
    accountId: v.optional(v.string()),
  })
    .index("byAccountId", ["accountId"])
    .index(BY_STRIPE_ID_INDEX_NAME, ["reviewId"]),
  stripePlans: defineTable({
    planId: v.string(),
    stripe: v.object(PlanSchema),
    lastSyncedAt: v.number(),
    accountId: v.optional(v.string()),
  })
    .index("byAccountId", ["accountId"])
    .index(BY_STRIPE_ID_INDEX_NAME, ["planId"]),
  stripeDisputes: defineTable({
    disputeId: v.string(),
    stripe: v.object(DisputeSchema),
    lastSyncedAt: v.number(),
    accountId: v.optional(v.string()),
  })
    .index("byAccountId", ["accountId"])
    .index(BY_STRIPE_ID_INDEX_NAME, ["disputeId"]),
  stripeEarlyFraudWarnings: defineTable({
    earlyFraudWarningId: v.string(),
    stripe: v.object(EarlyFraudWarningSchema),
    lastSyncedAt: v.number(),
    accountId: v.optional(v.string()),
  })
    .index("byAccountId", ["accountId"])
    .index(BY_STRIPE_ID_INDEX_NAME, ["earlyFraudWarningId"]),
  stripeTaxIds: defineTable({
    taxIdId: v.string(),
    stripe: v.object(TaxIdSchema),
    lastSyncedAt: v.number(),
    accountId: v.optional(v.string()),
  })
    .index("byAccountId", ["accountId"])
    .index(BY_STRIPE_ID_INDEX_NAME, ["taxIdId"]),
  stripeSetupIntents: defineTable({
    setupIntentId: v.string(),
    stripe: v.object(SetupIntentSchema),
    lastSyncedAt: v.number(),
    accountId: v.optional(v.string()),
  })
    .index("byAccountId", ["accountId"])
    .index(BY_STRIPE_ID_INDEX_NAME, ["setupIntentId"]),
  stripeCreditNotes: defineTable({
    creditNoteId: v.string(),
    stripe: v.object(CreditNoteSchema),
    lastSyncedAt: v.number(),
    accountId: v.optional(v.string()),
  })
    .index("byAccountId", ["accountId"])
    .index(BY_STRIPE_ID_INDEX_NAME, ["creditNoteId"]),
  stripeCharges: defineTable({
    chargeId: v.string(),
    stripe: v.object(ChargeSchema),
    lastSyncedAt: v.number(),
    accountId: v.optional(v.string()),
  })
    .index("byAccountId", ["accountId"])
    .index(BY_STRIPE_ID_INDEX_NAME, ["chargeId"]),
  stripePaymentMethods: defineTable({
    paymentMethodId: v.string(),
    stripe: v.object(PaymentMethodSchema),
    lastSyncedAt: v.number(),
    accountId: v.optional(v.string()),
  })
    .index("byAccountId", ["accountId"])
    .index(BY_STRIPE_ID_INDEX_NAME, ["paymentMethodId"]),
  stripeSubscriptionSchedules: defineTable({
    subscriptionScheduleId: v.string(),
    stripe: v.object(SubscriptionScheduleSchema),
    lastSyncedAt: v.number(),
    accountId: v.optional(v.string()),
  })
    .index("byAccountId", ["accountId"])
    .index(BY_STRIPE_ID_INDEX_NAME, ["subscriptionScheduleId"]),
  stripeMandates: defineTable({
    mandateId: v.string(),
    stripe: v.object(MandateSchema),
    lastSyncedAt: v.number(),
    accountId: v.optional(v.string()),
  })
    .index("byAccountId", ["accountId"])
    .index(BY_STRIPE_ID_INDEX_NAME, ["mandateId"]),
  stripeBillingPortalConfigurations: defineTable({
    billingPortalConfigurationId: v.string(),
    stripe: v.object(BillingPortalConfigurationSchema),
    lastSyncedAt: v.number(),
    accountId: v.optional(v.string()),
  })
    .index("byAccountId", ["accountId"])
    .index(BY_STRIPE_ID_INDEX_NAME, ["billingPortalConfigurationId"]),
  stripeTransfers: defineTable({
    transferId: v.string(),
    stripe: v.object(TransferSchema),
    lastSyncedAt: v.number(),
    accountId: v.optional(v.string()),
  })
    .index("byAccountId", ["accountId"])
    .index(BY_STRIPE_ID_INDEX_NAME, ["transferId"]),
  stripeCapabilities: defineTable({
    capabilityId: v.string(),
    stripe: v.object(CapabilitySchema),
    lastSyncedAt: v.number(),
    accountId: v.optional(v.string()),
  })
    .index("byAccountId", ["accountId"])
    .index(BY_STRIPE_ID_INDEX_NAME, ["capabilityId"]),
};

const stripeSchema = defineSchema(stripeTables);

export type StripeDataModel = DataModelFromSchemaDefinition<
  typeof stripeSchema
>;
