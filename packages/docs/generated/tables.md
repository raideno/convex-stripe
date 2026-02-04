## `stripeProducts`
Stores Stripe stripeProducts.

| Field        | Type      | Description         |
| :----------- | :-------- | :------------------ |
| productId    | `string`  |                     |
| stripe       | `object`  | Full Stripe object. |
| lastSyncedAt | `float64` |                     |


Indexes:
- `byStripeId`: `productId`

## `stripePrices`
Stores Stripe stripePrices.

| Field        | Type      | Description         |
| :----------- | :-------- | :------------------ |
| priceId      | `string`  |                     |
| stripe       | `object`  | Full Stripe object. |
| lastSyncedAt | `float64` |                     |


Indexes:
- `byStripeId`: `priceId`

## `stripeCustomers`
Stores Stripe stripeCustomers.

| Field        | Type      | Description         |
| :----------- | :-------- | :------------------ |
| customerId   | `string`  |                     |
| entityId     | `string`  |                     |
| stripe       | `object`  | Full Stripe object. |
| lastSyncedAt | `float64` |                     |


Indexes:
- `byStripeId`: `customerId`
- `byEntityId`: `entityId`

## `stripeSubscriptions`
Stores Stripe stripeSubscriptions.

| Field          | Type      | Description         |
| :------------- | :-------- | :------------------ |
| subscriptionId | `union`   |                     |
| customerId     | `string`  |                     |
| stripe         | `any`     | Full Stripe object. |
| lastSyncedAt   | `float64` |                     |


Indexes:
- `byStripeId`: `subscriptionId`
- `byCustomerId`: `customerId`

## `stripeCoupons`
Stores Stripe stripeCoupons.

| Field        | Type      | Description         |
| :----------- | :-------- | :------------------ |
| couponId     | `string`  |                     |
| stripe       | `object`  | Full Stripe object. |
| lastSyncedAt | `float64` |                     |


Indexes:
- `byStripeId`: `couponId`

## `stripePromotionCodes`
Stores Stripe stripePromotionCodes.

| Field           | Type      | Description         |
| :-------------- | :-------- | :------------------ |
| promotionCodeId | `string`  |                     |
| stripe          | `object`  | Full Stripe object. |
| lastSyncedAt    | `float64` |                     |


Indexes:
- `byStripeId`: `promotionCodeId`

## `stripePayouts`
Stores Stripe stripePayouts.

| Field        | Type      | Description         |
| :----------- | :-------- | :------------------ |
| payoutId     | `string`  |                     |
| stripe       | `object`  | Full Stripe object. |
| lastSyncedAt | `float64` |                     |


Indexes:
- `byStripeId`: `payoutId`

## `stripeRefunds`
Stores Stripe stripeRefunds.

| Field        | Type      | Description         |
| :----------- | :-------- | :------------------ |
| refundId     | `string`  |                     |
| stripe       | `object`  | Full Stripe object. |
| lastSyncedAt | `float64` |                     |


Indexes:
- `byStripeId`: `refundId`

## `stripePaymentIntents`
Stores Stripe stripePaymentIntents.

| Field           | Type      | Description         |
| :-------------- | :-------- | :------------------ |
| paymentIntentId | `string`  |                     |
| stripe          | `object`  | Full Stripe object. |
| lastSyncedAt    | `float64` |                     |


Indexes:
- `byStripeId`: `paymentIntentId`

## `stripeCheckoutSessions`
Stores Stripe stripeCheckoutSessions.

| Field             | Type      | Description         |
| :---------------- | :-------- | :------------------ |
| checkoutSessionId | `string`  |                     |
| stripe            | `object`  | Full Stripe object. |
| lastSyncedAt      | `float64` |                     |


Indexes:
- `byStripeId`: `checkoutSessionId`

## `stripeInvoices`
Stores Stripe stripeInvoices.

| Field        | Type      | Description         |
| :----------- | :-------- | :------------------ |
| invoiceId    | `string`  |                     |
| stripe       | `object`  | Full Stripe object. |
| lastSyncedAt | `float64` |                     |


Indexes:
- `byStripeId`: `invoiceId`

## `stripeReviews`
Stores Stripe stripeReviews.

| Field        | Type      | Description         |
| :----------- | :-------- | :------------------ |
| reviewId     | `string`  |                     |
| stripe       | `object`  | Full Stripe object. |
| lastSyncedAt | `float64` |                     |


Indexes:
- `byStripeId`: `reviewId`

## `stripePlans`
Stores Stripe stripePlans.

| Field        | Type      | Description         |
| :----------- | :-------- | :------------------ |
| planId       | `string`  |                     |
| stripe       | `object`  | Full Stripe object. |
| lastSyncedAt | `float64` |                     |


Indexes:
- `byStripeId`: `planId`

## `stripeDisputes`
Stores Stripe stripeDisputes.

| Field        | Type      | Description         |
| :----------- | :-------- | :------------------ |
| disputeId    | `string`  |                     |
| stripe       | `object`  | Full Stripe object. |
| lastSyncedAt | `float64` |                     |


Indexes:
- `byStripeId`: `disputeId`

## `stripeEarlyFraudWarnings`
Stores Stripe stripeEarlyFraudWarnings.

| Field               | Type      | Description         |
| :------------------ | :-------- | :------------------ |
| earlyFraudWarningId | `string`  |                     |
| stripe              | `object`  | Full Stripe object. |
| lastSyncedAt        | `float64` |                     |


Indexes:
- `byStripeId`: `earlyFraudWarningId`

## `stripeTaxIds`
Stores Stripe stripeTaxIds.

| Field        | Type      | Description         |
| :----------- | :-------- | :------------------ |
| taxIdId      | `string`  |                     |
| stripe       | `object`  | Full Stripe object. |
| lastSyncedAt | `float64` |                     |


Indexes:
- `byStripeId`: `taxIdId`

## `stripeSetupIntents`
Stores Stripe stripeSetupIntents.

| Field         | Type      | Description         |
| :------------ | :-------- | :------------------ |
| setupIntentId | `string`  |                     |
| stripe        | `object`  | Full Stripe object. |
| lastSyncedAt  | `float64` |                     |


Indexes:
- `byStripeId`: `setupIntentId`

## `stripeCreditNotes`
Stores Stripe stripeCreditNotes.

| Field        | Type      | Description         |
| :----------- | :-------- | :------------------ |
| creditNoteId | `string`  |                     |
| stripe       | `object`  | Full Stripe object. |
| lastSyncedAt | `float64` |                     |


Indexes:
- `byStripeId`: `creditNoteId`

## `stripeCharges`
Stores Stripe stripeCharges.

| Field        | Type      | Description         |
| :----------- | :-------- | :------------------ |
| chargeId     | `string`  |                     |
| stripe       | `object`  | Full Stripe object. |
| lastSyncedAt | `float64` |                     |


Indexes:
- `byStripeId`: `chargeId`

## `stripePaymentMethods`
Stores Stripe stripePaymentMethods.

| Field           | Type      | Description         |
| :-------------- | :-------- | :------------------ |
| paymentMethodId | `string`  |                     |
| stripe          | `object`  | Full Stripe object. |
| lastSyncedAt    | `float64` |                     |


Indexes:
- `byStripeId`: `paymentMethodId`

## `stripeSubscriptionSchedules`
Stores Stripe stripeSubscriptionSchedules.

| Field                  | Type      | Description         |
| :--------------------- | :-------- | :------------------ |
| subscriptionScheduleId | `string`  |                     |
| stripe                 | `object`  | Full Stripe object. |
| lastSyncedAt           | `float64` |                     |


Indexes:
- `byStripeId`: `subscriptionScheduleId`

## `stripeMandates`
Stores Stripe stripeMandates.

| Field        | Type      | Description         |
| :----------- | :-------- | :------------------ |
| mandateId    | `string`  |                     |
| stripe       | `object`  | Full Stripe object. |
| lastSyncedAt | `float64` |                     |


Indexes:
- `byStripeId`: `mandateId`

## `stripeBillingPortalConfigurations`
Stores Stripe stripeBillingPortalConfigurations.

| Field                        | Type      | Description         |
| :--------------------------- | :-------- | :------------------ |
| billingPortalConfigurationId | `string`  |                     |
| stripe                       | `object`  | Full Stripe object. |
| lastSyncedAt                 | `float64` |                     |


Indexes:
- `byStripeId`: `billingPortalConfigurationId`