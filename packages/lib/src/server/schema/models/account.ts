import { Infer, v } from "convex/values";
import Stripe from "stripe";

import { metadata, nullablestring } from "@/schema/validators";

export const AccountStripeToConvex = (
  account: Stripe.Account & { id: string },
) => {
  const object: Infer<typeof AccountObject> = {
    id: account.id,
    object: account.object,

    business_type: account.business_type,
    capabilities: account.capabilities ?? null,

    company: account.company ?? null,
    country: account.country,
    email: account.email,

    individual: account.individual ?? null,
    metadata: account.metadata ?? null,

    requirements: account.requirements ?? null,
    tos_acceptance: account.tos_acceptance,

    type: account.type,

    // More attributes
    business_profile: account.business_profile ?? null,
    charges_enabled: account.charges_enabled,
    controller: account.controller ?? null,
    created: account.created,
    default_currency: account.default_currency,
    details_submitted: account.details_submitted,
    external_accounts: account.external_accounts ?? null,
    future_requirements: account.future_requirements ?? null,
    groups: (account as any).groups ?? null, // Preview feature
    payouts_enabled: account.payouts_enabled,
    settings: account.settings ?? null,
  };

  return object;
};

export const AccountSchema = {
  id: v.string(),
  object: v.string(),

  business_type: v.optional(
    v.union(
      v.literal("company"),
      v.literal("government_entity"), // US only
      v.literal("individual"),
      v.literal("non_profit"),
      v.null(),
    ),
  ),

  // capabilities: very wide set of keys; keep as any for now
  // TODO: model capability keys you care about as v.optional(v.union(...))
  capabilities: v.optional(v.any()),

  // company: large nested structure with many optional fields
  // TODO: model company subfields as needed
  company: v.optional(v.any()),

  country: v.optional(v.string()),
  email: v.optional(nullablestring()),

  // individual: only present when business_type = "individual"
  // TODO: model individual subfields as needed
  individual: v.optional(v.any()),

  metadata: v.optional(v.union(metadata(), v.null())),

  // requirements: complex nested structure
  // TODO: model requirements subfields as needed
  requirements: v.optional(v.any()),

  // tos_acceptance exists (not nullable in Stripe docs), but fields can be null
  // TODO: if you want strict typing, model the subfields
  tos_acceptance: v.any(),

  type: v.union(
    v.literal("custom"),
    v.literal("express"),
    v.literal("none"),
    v.literal("standard"),
  ),

  // More attributes
  // TODO: model business_profile subfields as needed
  business_profile: v.optional(v.any()),
  charges_enabled: v.boolean(),
  // TODO: model controller subfields as needed
  controller: v.optional(v.any()),
  created: v.optional(v.number()),
  default_currency: v.optional(v.string()),
  details_submitted: v.boolean(),
  // TODO: model external_accounts list object as needed
  external_accounts: v.optional(v.any()),
  // TODO: model future_requirements subfields as needed
  future_requirements: v.optional(v.any()),

  // Preview feature (expandable)
  // TODO: model groups if you rely on it
  groups: v.optional(v.any()),

  payouts_enabled: v.boolean(),

  // TODO: settings is large
  settings: v.optional(v.any()),
};

export const AccountObject = v.object(AccountSchema);
