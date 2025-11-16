import { Infer, v } from "convex/values";
import Stripe from "stripe";

import {
  nullablenumber,
  nullablestring,
  optionalany,
  optionalnullableobject,
} from "@/helpers";

export const MandateStripeToConvex = (mandate: Stripe.Mandate) => {
  const object: Infer<typeof MandateObject> = {
    id: mandate.id,
    customer_acceptance: mandate.customer_acceptance,
    payment_method:
      typeof mandate.payment_method === "string"
        ? mandate.payment_method
        : mandate.payment_method.id,
    payment_method_details: mandate.payment_method_details,
    status: mandate.status,
    type: mandate.type,
    object: mandate.object,
    livemode: mandate.livemode,
    multi_use: mandate.multi_use,
    on_behalf_of: mandate.on_behalf_of,
    single_use: mandate.single_use,
  };
  return object;
};

export const MandateSchema = {
  id: v.string(),
  customer_acceptance: v.object({
    accepted_at: v.optional(nullablenumber()),
    // offline: optionalnullableobject({
    //   // TODO: complete
    // }),
    offline: optionalany(),
    online: optionalnullableobject({
      ip_address: v.optional(nullablestring()),
      user_agent: v.optional(nullablestring()),
    }),
    type: v.union(v.literal("offline"), v.literal("online")),
  }),
  payment_method: v.string(),
  // payment_method_details: v.object({
  //   // TODO: complete
  // }),
  payment_method_details: optionalany(),
  status: v.union(
    v.literal("active"),
    v.literal("inactive"),
    v.literal("pending")
  ),
  type: v.union(v.literal("multi_use"), v.literal("single_use")),
  object: v.string(),
  livemode: v.boolean(),
  // multi_use: optionalnullableobject({
  //   // TODO: complete
  // }),
  multi_use: optionalany(),
  on_behalf_of: v.optional(nullablestring()),
  single_use: optionalnullableobject({
    amount: v.number(),
    currency: v.string(),
  }),
};

export const MandateObject = v.object(MandateSchema);
