## `stripeAccounts`
Stores Stripe stripeAccounts.

| Field        | Type      | Description         |
| :----------- | :-------- | :------------------ |
| accountId    | `string`  |                     |
| entityId     | `string`  |                     |
| stripe       | `object`  | Full Stripe object. |
| lastSyncedAt | `float64` |                     |


Indexes:
- `byStripeId`: `accountId`
- `byEntityId`: `entityId`

## `stripeProducts`
Stores Stripe stripeProducts.

| Field        | Type      | Description         |
| :----------- | :-------- | :------------------ |
| productId    | `string`  |                     |
| stripe       | `object`  | Full Stripe object. |
| lastSyncedAt | `float64` |                     |
| accountId    | `string`  |                     |


Indexes:
- `byStripeId`: `productId`
- `byAccountId`: `accountId`

## `stripePrices`
Stores Stripe stripePrices.

| Field        | Type      | Description         |
| :----------- | :-------- | :------------------ |
| priceId      | `string`  |                     |
| stripe       | `object`  | Full Stripe object. |
| lastSyncedAt | `float64` |                     |
| accountId    | `string`  |                     |


Indexes:
- `byStripeId`: `priceId`
- `byAccountId`: `accountId`

## `stripeCustomers`
Stores Stripe stripeCustomers.

| Field        | Type      | Description         |
| :----------- | :-------- | :------------------ |
| customerId   | `string`  |                     |
| entityId     | `string`  |                     |
| stripe       | `object`  | Full Stripe object. |
| lastSyncedAt | `float64` |                     |
| accountId    | `string`  |                     |


Indexes:
- `byStripeId`: `customerId`
- `byEntityId`: `entityId`
- `byAccountId`: `accountId`

## `stripeSubscriptions`
Stores Stripe stripeSubscriptions.

| Field          | Type      | Description         |
| :------------- | :-------- | :------------------ |
| subscriptionId | `union`   |                     |
| customerId     | `string`  |                     |
| stripe         | `any`     | Full Stripe object. |
| lastSyncedAt   | `float64` |                     |
| accountId      | `string`  |                     |


Indexes:
- `byStripeId`: `subscriptionId`
- `byCustomerId`: `customerId`
- `byAccountId`: `accountId`

## `stripeCoupons`
Stores Stripe stripeCoupons.

| Field        | Type      | Description         |
| :----------- | :-------- | :------------------ |
| couponId     | `string`  |                     |
| stripe       | `object`  | Full Stripe object. |
| lastSyncedAt | `float64` |                     |
| accountId    | `string`  |                     |


Indexes:
- `byStripeId`: `couponId`
- `byAccountId`: `accountId`

## `stripePromotionCodes`
Stores Stripe stripePromotionCodes.

| Field           | Type      | Description         |
| :-------------- | :-------- | :------------------ |
| promotionCodeId | `string`  |                     |
| stripe          | `object`  | Full Stripe object. |
| lastSyncedAt    | `float64` |                     |
| accountId       | `string`  |                     |


Indexes:
- `byStripeId`: `promotionCodeId`
- `byAccountId`: `accountId`

## `stripePayouts`
Stores Stripe stripePayouts.

| Field        | Type      | Description         |
| :----------- | :-------- | :------------------ |
| payoutId     | `string`  |                     |
| stripe       | `object`  | Full Stripe object. |
| lastSyncedAt | `float64` |                     |
| accountId    | `string`  |                     |


Indexes:
- `byStripeId`: `payoutId`
- `byAccountId`: `accountId`

## `stripeRefunds`
Stores Stripe stripeRefunds.

| Field        | Type      | Description         |
| :----------- | :-------- | :------------------ |
| refundId     | `string`  |                     |
| stripe       | `object`  | Full Stripe object. |
| lastSyncedAt | `float64` |                     |
| accountId    | `string`  |                     |


Indexes:
- `byStripeId`: `refundId`
- `byAccountId`: `accountId`

## `stripePaymentIntents`
Stores Stripe stripePaymentIntents.

| Field           | Type      | Description         |
| :-------------- | :-------- | :------------------ |
| paymentIntentId | `string`  |                     |
| stripe          | `object`  | Full Stripe object. |
| lastSyncedAt    | `float64` |                     |
| accountId       | `string`  |                     |


Indexes:
- `byStripeId`: `paymentIntentId`
- `byAccountId`: `accountId`

## `stripeCheckoutSessions`
Stores Stripe stripeCheckoutSessions.

| Field             | Type      | Description         |
| :---------------- | :-------- | :------------------ |
| checkoutSessionId | `string`  |                     |
| stripe            | `object`  | Full Stripe object. |
| lastSyncedAt      | `float64` |                     |
| accountId         | `string`  |                     |


Indexes:
- `byStripeId`: `checkoutSessionId`
- `byAccountId`: `accountId`

## `stripeInvoices`
Stores Stripe stripeInvoices.

| Field        | Type      | Description         |
| :----------- | :-------- | :------------------ |
| invoiceId    | `string`  |                     |
| stripe       | `object`  | Full Stripe object. |
| lastSyncedAt | `float64` |                     |
| accountId    | `string`  |                     |


Indexes:
- `byStripeId`: `invoiceId`
- `byAccountId`: `accountId`

## `stripeReviews`
Stores Stripe stripeReviews.

| Field        | Type      | Description         |
| :----------- | :-------- | :------------------ |
| reviewId     | `string`  |                     |
| stripe       | `object`  | Full Stripe object. |
| lastSyncedAt | `float64` |                     |
| accountId    | `string`  |                     |


Indexes:
- `byStripeId`: `reviewId`
- `byAccountId`: `accountId`

## `stripePlans`
Stores Stripe stripePlans.

| Field        | Type      | Description         |
| :----------- | :-------- | :------------------ |
| planId       | `string`  |                     |
| stripe       | `object`  | Full Stripe object. |
| lastSyncedAt | `float64` |                     |
| accountId    | `string`  |                     |


Indexes:
- `byStripeId`: `planId`
- `byAccountId`: `accountId`

## `stripeDisputes`
Stores Stripe stripeDisputes.

| Field        | Type      | Description         |
| :----------- | :-------- | :------------------ |
| disputeId    | `string`  |                     |
| stripe       | `object`  | Full Stripe object. |
| lastSyncedAt | `float64` |                     |
| accountId    | `string`  |                     |


Indexes:
- `byStripeId`: `disputeId`
- `byAccountId`: `accountId`

## `stripeEarlyFraudWarnings`
Stores Stripe stripeEarlyFraudWarnings.

| Field               | Type      | Description         |
| :------------------ | :-------- | :------------------ |
| earlyFraudWarningId | `string`  |                     |
| stripe              | `object`  | Full Stripe object. |
| lastSyncedAt        | `float64` |                     |
| accountId           | `string`  |                     |


Indexes:
- `byStripeId`: `earlyFraudWarningId`
- `byAccountId`: `accountId`

## `stripeTaxIds`
Stores Stripe stripeTaxIds.

| Field        | Type      | Description         |
| :----------- | :-------- | :------------------ |
| taxIdId      | `string`  |                     |
| stripe       | `object`  | Full Stripe object. |
| lastSyncedAt | `float64` |                     |
| accountId    | `string`  |                     |


Indexes:
- `byStripeId`: `taxIdId`
- `byAccountId`: `accountId`

## `stripeSetupIntents`
Stores Stripe stripeSetupIntents.

| Field         | Type      | Description         |
| :------------ | :-------- | :------------------ |
| setupIntentId | `string`  |                     |
| stripe        | `object`  | Full Stripe object. |
| lastSyncedAt  | `float64` |                     |
| accountId     | `string`  |                     |


Indexes:
- `byStripeId`: `setupIntentId`
- `byAccountId`: `accountId`

## `stripeCreditNotes`
Stores Stripe stripeCreditNotes.

| Field        | Type      | Description         |
| :----------- | :-------- | :------------------ |
| creditNoteId | `string`  |                     |
| stripe       | `object`  | Full Stripe object. |
| lastSyncedAt | `float64` |                     |
| accountId    | `string`  |                     |


Indexes:
- `byStripeId`: `creditNoteId`
- `byAccountId`: `accountId`

## `stripeCharges`
Stores Stripe stripeCharges.

| Field        | Type      | Description         |
| :----------- | :-------- | :------------------ |
| chargeId     | `string`  |                     |
| stripe       | `object`  | Full Stripe object. |
| lastSyncedAt | `float64` |                     |
| accountId    | `string`  |                     |


Indexes:
- `byStripeId`: `chargeId`
- `byAccountId`: `accountId`

## `stripePaymentMethods`
Stores Stripe stripePaymentMethods.

| Field           | Type      | Description         |
| :-------------- | :-------- | :------------------ |
| paymentMethodId | `string`  |                     |
| stripe          | `object`  | Full Stripe object. |
| lastSyncedAt    | `float64` |                     |
| accountId       | `string`  |                     |


Indexes:
- `byStripeId`: `paymentMethodId`
- `byAccountId`: `accountId`

## `stripeSubscriptionSchedules`
Stores Stripe stripeSubscriptionSchedules.

| Field                  | Type      | Description         |
| :--------------------- | :-------- | :------------------ |
| subscriptionScheduleId | `string`  |                     |
| stripe                 | `object`  | Full Stripe object. |
| lastSyncedAt           | `float64` |                     |
| accountId              | `string`  |                     |


Indexes:
- `byStripeId`: `subscriptionScheduleId`
- `byAccountId`: `accountId`

## `stripeMandates`
Stores Stripe stripeMandates.

| Field        | Type      | Description         |
| :----------- | :-------- | :------------------ |
| mandateId    | `string`  |                     |
| stripe       | `object`  | Full Stripe object. |
| lastSyncedAt | `float64` |                     |
| accountId    | `string`  |                     |


Indexes:
- `byStripeId`: `mandateId`
- `byAccountId`: `accountId`

## `stripeBillingPortalConfigurations`
Stores Stripe stripeBillingPortalConfigurations.

| Field                        | Type      | Description         |
| :--------------------------- | :-------- | :------------------ |
| billingPortalConfigurationId | `string`  |                     |
| stripe                       | `object`  | Full Stripe object. |
| lastSyncedAt                 | `float64` |                     |
| accountId                    | `string`  |                     |


Indexes:
- `byStripeId`: `billingPortalConfigurationId`
- `byAccountId`: `accountId`

## `stripeTransfers`
Stores Stripe stripeTransfers.

| Field        | Type      | Description         |
| :----------- | :-------- | :------------------ |
| transferId   | `string`  |                     |
| stripe       | `object`  | Full Stripe object. |
| lastSyncedAt | `float64` |                     |
| accountId    | `string`  |                     |


Indexes:
- `byStripeId`: `transferId`
- `byAccountId`: `accountId`

## `stripeCapabilities`
Stores Stripe stripeCapabilities.

| Field        | Type      | Description         |
| :----------- | :-------- | :------------------ |
| capabilityId | `string`  |                     |
| stripe       | `object`  | Full Stripe object. |
| lastSyncedAt | `float64` |                     |
| accountId    | `string`  |                     |


Indexes:
- `byStripeId`: `capabilityId`
- `byAccountId`: `accountId`