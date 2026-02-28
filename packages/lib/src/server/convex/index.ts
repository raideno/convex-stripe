import { InternalConfiguration, InternalOptions } from "@/types";

import { buildCustomer } from "./helpers/customer";
import { buildCreateCustomer } from "./helpers/create-customer";
import { buildPay } from "./helpers/pay";
import { buildPortal } from "./helpers/portal";
import { buildProducts } from "./helpers/products";
import { buildSubscribe } from "./helpers/subscribe";
import { buildSubscription } from "./helpers/subscription";
import { HelperAuthCallback, StripeHelpersConfig } from "./types";

export type { HelperAuthCallback, StripeHelpersConfig };
export type { ActionOperation, HelperOperation, QueryOperation } from "./types";
export type { SubscribeUrls, PayUrls, PortalUrls } from "./types";

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
    const { authenticateAndAuthorize, urls } = config;

    return {
        createCustomer: buildCreateCustomer(
            configuration,
            options,
            authenticateAndAuthorize,
        ),
        subscribe: buildSubscribe(
            configuration,
            options,
            authenticateAndAuthorize,
            urls,
        ),
        pay: buildPay(
            configuration,
            options,
            authenticateAndAuthorize,
            urls,
        ),
        products: buildProducts(configuration, options, authenticateAndAuthorize),
        subscription: buildSubscription(
            configuration,
            options,
            authenticateAndAuthorize,
        ),
        customer: buildCustomer(configuration, options, authenticateAndAuthorize),
        portal: buildPortal(
            configuration,
            options,
            authenticateAndAuthorize,
            urls,
        ),
    };
};
