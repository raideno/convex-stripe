import { Infer, v } from "convex/values";
import Stripe from "stripe";

import { nullablenumber } from "@/schema/validators";

export const CapabilityStripeToConvex = (
  capability: Stripe.Capability & { id: string },
) => {
  const object: Infer<typeof CapabilityObject> = {
    id: capability.id,
    account:
      typeof capability.account === "string"
        ? capability.account
        : capability.account.id,
    requested: capability.requested,
    requirements: capability.requirements ?? null,
    status: capability.status,
    object: capability.object,
    future_requirements: capability.future_requirements ?? null,
    requested_at: capability.requested_at ?? null,
  };

  return object;
};

export const CapabilitySchema = {
  id: v.string(),
  account: v.string(),
  requested: v.boolean(),
  // requirements: v.object({
  //   // TODO: complete
  // }),
  requirements: v.any(),
  status: v.union(
    v.literal("active"),
    v.literal("inactive"),
    v.literal("pending"),
    v.literal("unrequested"),
  ),
  object: v.string(),
  // future_requirements: v.object({
  //   // TODO: complete
  // }),
  future_requirements: v.any(),
  requested_at: v.optional(nullablenumber()),
};

export const CapabilityObject = v.object(CapabilitySchema);
