import { GenericActionCtx, GenericQueryCtx } from "convex/server";

/**
 * The operations handled by action-type helpers (run in an action context).
 */
export type ActionOperation = "createCustomer";

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
 * Configuration for the pre-built Stripe helpers.
 */
export interface StripeHelpersConfig {
  /**
   * Callback that authenticates the caller and returns [isAuthorized, resolvedEntityId].
   */
  authenticateAndAuthorize: HelperAuthCallback;
}
