import { InternalConfiguration, InternalOptions } from "@/types";

import { buildCreateCustomer } from "./helpers/create-customer";
import { buildCustomer } from "./helpers/customer";
import { buildProducts } from "./helpers/products";
import { buildSubscription } from "./helpers/subscription";
import { HelperAuthCallback, StripeHelpersConfig } from "./types";

export type { ActionOperation, HelperOperation, QueryOperation } from "./types";
export type { HelperAuthCallback, StripeHelpersConfig };

/**
 * Builds the pre-made Convex functions returned by `stripe.helpers()`.
 * Not meant to be called directly — use `stripe.helpers()` instead.
 *
 * @internal
 */
export const buildHelpers = (
  configuration: InternalConfiguration,
  options: InternalOptions,
  config: StripeHelpersConfig,
) => {
  const { authenticateAndAuthorize } = config;

  return {
    createCustomer: buildCreateCustomer(
      configuration,
      options,
      authenticateAndAuthorize,
    ),
    products: buildProducts(configuration, options, authenticateAndAuthorize),
    subscription: buildSubscription(
      configuration,
      options,
      authenticateAndAuthorize,
    ),
    customer: buildCustomer(configuration, options, authenticateAndAuthorize),
  };
};
