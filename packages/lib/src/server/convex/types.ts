import { GenericActionCtx, GenericQueryCtx } from "convex/server";

/**
 * The operations handled by action-type helpers (run in an action context).
 */
export type ActionOperation =
    | "createCustomer"
    | "subscribe"
    | "pay"
    | "portal";

/**
 * The operations handled by query-type helpers (run in a query context).
 */
export type QueryOperation = "products" | "subscription" | "customer";

/**
 * All operations supported by `stripe.helpers()`.
 */
export type HelperOperation = ActionOperation | QueryOperation;

/**
 * Arguments passed to the `authenticateAndAuthorize` callback.
 *
 * This is a discriminated union: when `operation` is an action-type operation,
 * `context` is narrowed to `GenericActionCtx<any>`. For query-type operations,
 * it is narrowed to `GenericQueryCtx<any>`.
 */
export type AuthArgs =
    | {
        context: GenericActionCtx<any>;
        operation: ActionOperation;
        entityId?: string;
    }
    | {
        context: GenericQueryCtx<any>;
        operation: QueryOperation;
        entityId?: string;
    };

/**
 * The callback used by `stripe.helpers()` to authenticate and authorize
 * the caller for a given operation.
 *
 * **Contract:**
 * - Return `[true, entityId]` when the caller is authenticated and the
 *   resolved `entityId` should be used for the Stripe operation.
 * - Return `[false, null]` (or throw) to reject the request.
 * - When no `entityId` is passed to the helper function, it means the
 *   caller wants to act on themselves — the callback is responsible for
 *   deriving their identity from `context` (e.g. via `getAuthUserId`).
 *
 * @example
 * const authenticateAndAuthorize: HelperAuthCallback = async ({
 *   context,
 *   operation,
 *   entityId,
 * }) => {
 *   if (operation === "products") return [true, null];
 *   const userId = await getAuthUserId(context);
 *   if (!userId) return [false, null];
 *   return [true, entityId ?? userId];
 * };
 */
export type HelperAuthCallback = (
    args: AuthArgs,
) => Promise<[boolean, string | null]>;

/**
 * A value that resolves to a URL string. Can be a static string or a
 * function (sync or async) that receives the operation context and arguments.
 */
export type UrlResolver<T> =
    | string
    | ((args: {
        context: GenericActionCtx<any>;
        entityId: string;
        args: T;
    }) => string | Promise<string>);

/**
 * URL configuration for the `subscribe` helper.
 */
export interface SubscribeUrls {
    /** URL to redirect to after a successful subscription checkout. */
    success: UrlResolver<{ priceId: string }>;
    /** URL to redirect to if a subscription checkout is cancelled. */
    cancel: UrlResolver<{ priceId: string }>;
    /** URL to redirect to if redirect signing fails. */
    failure: UrlResolver<{ priceId: string }>;
}

/**
 * URL configuration for the `pay` helper.
 */
export interface PayUrls {
    /** URL to redirect to after a successful one-time payment. */
    success: UrlResolver<{
        referenceId: string;
        line_items: Array<{ price: string; quantity: number }>;
    }>;
    /** URL to redirect to if a one-time payment is cancelled. */
    cancel: UrlResolver<{
        referenceId: string;
        line_items: Array<{ price: string; quantity: number }>;
    }>;
    /** URL to redirect to if redirect signing fails. */
    failure: UrlResolver<{
        referenceId: string;
        line_items: Array<{ price: string; quantity: number }>;
    }>;
}

/**
 * URL configuration for the `portal` helper.
 */
export interface PortalUrls {
    /** URL to redirect to when the user returns from the billing portal. */
    return: UrlResolver<{}>;
    /** URL to redirect to if redirect signing fails. */
    failure: UrlResolver<{}>;
}

/**
 * Configuration for the pre-built Stripe helpers.
 */
export interface StripeHelpersConfig {
    /**
     * Callback that authenticates the caller and returns [isAuthorized, resolvedEntityId].
     */
    authenticateAndAuthorize: HelperAuthCallback;

    /**
     * Centralized return URL configuration for checkout and portal sessions.
     * All URLs are required — they are no longer accepted as per-call arguments.
     */
    urls: {
        /** URLs for the `subscribe` helper (success, cancel, failure). */
        subscribe: SubscribeUrls;
        /** URLs for the `pay` helper (success, cancel, failure). */
        pay: PayUrls;
        /** URLs for the `portal` helper (return, failure). */
        portal: PortalUrls;
    };
}
