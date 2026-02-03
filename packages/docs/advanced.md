# Advanced

## Migration

If you're not starting from a fresh stripe setup, meaning you already have subscribers and customers, when calling the `sync` method, syncing will be done for all products, prices, etc but not for customers and subscriptions, this is because the package needs to know to which entity is this subscription associated and for that it'll check inside the customer's metadata and check for an `entityId` and if none is found, the customer won't be synced.
So to sync this missing customers you must set an `entityId` attribute inside their metadata.

Helper functions will soon be provided to deal with this cases.

If you only want to use the library to sync stripe, you can run it detached mode were it won't handle entities, to do this pass `detached: true` inside the `internalStripe` function.
