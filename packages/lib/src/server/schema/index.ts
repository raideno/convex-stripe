import {
  DataModelFromSchemaDefinition,
  defineSchema,
  defineTable,
  DocumentByName,
} from "convex/server";
import { v } from "convex/values";

import { BillingPortalConfigurationSchema } from "@/schema/models/billing-portal-configuration";
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

export const stripeTables = {
  stripeProducts: defineTable({
    productId: v.string(),
    stripe: v.object(ProductSchema),
    lastSyncedAt: v.number(),
  })
    .index("byActive", ["stripe.active"])
    .index("byName", ["stripe.name"]),
  stripePrices: defineTable({
    priceId: v.string(),
    stripe: v.object(PriceSchema),
    lastSyncedAt: v.number(),
  })
    .index("byPriceId", ["priceId"])
    .index("byActive", ["stripe.active"])
    .index("byRecurringInterval", ["stripe.recurring.interval"])
    .index("byCurrency", ["stripe.currency"]),
  stripeCustomers: defineTable({
    customerId: v.string(),
    entityId: v.optional(v.string()),
    stripe: v.object(CustomerSchema),
    lastSyncedAt: v.number(),
  })
    .index("byCustomerId", ["customerId"])
    .index("byEntityId", ["entityId"]),
  stripeSubscriptions: defineTable({
    subscriptionId: v.union(v.string(), v.null()),
    customerId: v.string(),
    stripe: SubscriptionObject,
    lastSyncedAt: v.number(),
  })
    .index("bySubscriptionId", ["subscriptionId"])
    .index("byCustomerId", ["customerId"]),
  stripeCoupons: defineTable({
    couponId: v.string(),
    stripe: v.object(CouponSchema),
    lastSyncedAt: v.number(),
  }).index("byCouponId", ["couponId"]),
  stripePromotionCodes: defineTable({
    promotionCodeId: v.string(),
    stripe: v.object(PromotionCodeSchema),
    lastSyncedAt: v.number(),
  }).index("byPromotionCodeId", ["promotionCodeId"]),
  stripePayouts: defineTable({
    payoutId: v.string(),
    stripe: v.object(PayoutSchema),
    lastSyncedAt: v.number(),
  }).index("byPayoutId", ["payoutId"]),
  stripeRefunds: defineTable({
    refundId: v.string(),
    stripe: v.object(RefundSchema),
    lastSyncedAt: v.number(),
  }).index("byRefundId", ["refundId"]),
  stripePaymentIntents: defineTable({
    paymentIntentId: v.string(),
    stripe: v.object(PaymentIntentSchema),
    lastSyncedAt: v.number(),
  }).index("byPaymentIntentId", ["paymentIntentId"]),
  stripeCheckoutSessions: defineTable({
    checkoutSessionId: v.string(),
    stripe: v.object(CheckoutSessionSchema),
    lastSyncedAt: v.number(),
  }).index("byCheckoutSessionId", ["checkoutSessionId"]),
  stripeInvoices: defineTable({
    invoiceId: v.string(),
    stripe: v.object(InvoiceSchema),
    lastSyncedAt: v.number(),
  }).index("byInvoiceId", ["invoiceId"]),
  stripeReviews: defineTable({
    reviewId: v.string(),
    stripe: v.object(ReviewSchema),
    lastSyncedAt: v.number(),
  }).index("reviewId", ["reviewId"]),
  stripePlans: defineTable({
    planId: v.string(),
    stripe: v.object(PlanSchema),
    lastSyncedAt: v.number(),
  }).index("byPlanId", ["planId"]),
  stripeDisputes: defineTable({
    disputeId: v.string(),
    stripe: v.object(DisputeSchema),
    lastSyncedAt: v.number(),
  }).index("byDisputeId", ["disputeId"]),
  stripeEarlyFraudWarnings: defineTable({
    earlyFraudWarningId: v.string(),
    stripe: v.object(EarlyFraudWarningSchema),
    lastSyncedAt: v.number(),
  }).index("byEarlyFraudWarningId", ["earlyFraudWarningId"]),
  stripeTaxIds: defineTable({
    taxIdId: v.string(),
    stripe: v.object(TaxIdSchema),
    lastSyncedAt: v.number(),
  }).index("byTaxIdId", ["taxIdId"]),
  stripeSetupIntents: defineTable({
    setupIntentId: v.string(),
    stripe: v.object(SetupIntentSchema),
    lastSyncedAt: v.number(),
  }).index("bySetupIntentId", ["setupIntentId"]),
  stripeCreditNotes: defineTable({
    creditNoteId: v.string(),
    stripe: v.object(CreditNoteSchema),
    lastSyncedAt: v.number(),
  }).index("byCreditNoteId", ["creditNoteId"]),
  stripeCharges: defineTable({
    chargeId: v.string(),
    stripe: v.object(ChargeSchema),
    lastSyncedAt: v.number(),
  }).index("byChargeId", ["chargeId"]),
  stripePaymentMethods: defineTable({
    paymentMethodId: v.string(),
    stripe: v.object(PaymentMethodSchema),
    lastSyncedAt: v.number(),
  }).index("byPaymentMethodId", ["paymentMethodId"]),
  stripeSubscriptionSchedules: defineTable({
    subscriptionScheduleId: v.string(),
    stripe: v.object(SubscriptionScheduleSchema),
    lastSyncedAt: v.number(),
  }).index("bySubscriptionScheduleId", ["subscriptionScheduleId"]),
  stripeMandates: defineTable({
    mandateId: v.string(),
    stripe: v.object(MandateSchema),
    lastSyncedAt: v.number(),
  }).index("byMandateId", ["mandateId"]),
  stripeBillingPortalConfigurations: defineTable({
    billingPortalConfigurationId: v.string(),
    stripe: v.object(BillingPortalConfigurationSchema),
    lastSyncedAt: v.number(),
  }).index("byBillingPortalConfigurationId", ["billingPortalConfigurationId"]),
};

const stripeSchema = defineSchema(stripeTables);

export type StripeDataModel = DataModelFromSchemaDefinition<
  typeof stripeSchema
>;
