import Stripe from "stripe";

import { v } from "convex/values";

import { defineActionImplementation } from "@/helpers";

type OnExistingBehavior = "update" | "archive_and_recreate" | "skip" | "error";

type OnMissingKeyBehavior = "create" | "error";

const pickProductUpdateParams = (
  product: Stripe.ProductCreateParams,
): Stripe.ProductUpdateParams => {
  const {
    active,
    description,
    images,
    marketing_features,
    metadata,
    name,
    package_dimensions,
    shippable,
    statement_descriptor,
    tax_code,
    unit_label,
    url,
  } = product;

  return {
    active,
    description,
    images,
    marketing_features,
    metadata,
    name,
    package_dimensions,
    shippable,
    statement_descriptor,
    tax_code,
    unit_label,
    url,
  };
};

const pickPriceUpdateParams = (
  price: Stripe.PriceCreateParams,
): Stripe.PriceUpdateParams => {
  const { active, metadata, nickname, tax_behavior, transfer_lookup_key } =
    price;

  return {
    active,
    metadata,
    nickname,
    tax_behavior,
    transfer_lookup_key,
  };
};

const getProductKey = (
  product: Stripe.ProductCreateParams,
  metadataKey: string,
): string | undefined => {
  const productId = (product as Stripe.ProductCreateParams & { id?: string })
    .id;
  const metadataValue = product.metadata?.[metadataKey];
  if (metadataValue !== undefined && metadataValue !== null)
    return String(metadataValue);

  return productId || product.name;
};

const getPriceKey = (
  price: Stripe.PriceCreateParams,
  metadataKey: string,
): string | undefined => {
  if (price.lookup_key) return price.lookup_key;

  const metadataValue = price.metadata?.[metadataKey];
  if (metadataValue !== undefined && metadataValue !== null)
    return String(metadataValue);

  return price.nickname || undefined;
};

const buildMetadata = (
  metadata: Stripe.MetadataParam | undefined,
  metadataKey: string,
  key: string | undefined,
): Stripe.MetadataParam | undefined => {
  if (!key) return metadata;
  return {
    ...(metadata || {}),
    [metadataKey]: key,
  };
};

const resolveProductIdForPrice = (
  price: Stripe.PriceCreateParams,
  productIdsByKey: Map<string, string>,
): Stripe.PriceCreateParams => {
  if (typeof price.product === "string" && productIdsByKey.has(price.product)) {
    const product = productIdsByKey.get(price.product)!;
    const { product_data, ...rest } = price as Stripe.PriceCreateParams & {
      product_data?: Stripe.PriceCreateParams.ProductData;
    };
    return {
      ...rest,
      product,
    };
  }
  return price;
};

const pickExistingProduct = (
  product: Stripe.ProductCreateParams,
  metadataKey: string,
  products: Stripe.Product[],
): Stripe.Product | undefined => {
  const productId = (product as Stripe.ProductCreateParams & { id?: string })
    .id;
  if (productId) return products.find((item) => item.id === productId);

  const metaKey = product.metadata?.[metadataKey];
  if (metaKey)
    return products.find((item) => item.metadata?.[metadataKey] === metaKey);

  if (product.name) return products.find((item) => item.name === product.name);

  return undefined;
};

const pickExistingPrice = (
  price: Stripe.PriceCreateParams,
  metadataKey: string,
  prices: Stripe.Price[],
): Stripe.Price | undefined => {
  if (price.lookup_key)
    return prices.find((item) => item.lookup_key === price.lookup_key);

  const metaKey = price.metadata?.[metadataKey];
  if (metaKey)
    return prices.find((item) => item.metadata?.[metadataKey] === metaKey);

  if (price.nickname)
    return prices.find((item) => item.nickname === price.nickname);

  return undefined;
};

export const SyncCatalogImplementation = defineActionImplementation({
  args: v.object({}),
  name: "syncCatalog",
  handler: async (context, args, configuration) => {
    const catalog = configuration.sync.catalog;
    const products = catalog.products || [];
    const prices = catalog.prices || [];

    if (products.length === 0 && prices.length === 0) return;

    const stripe = new Stripe(configuration.stripe.secret_key, {
      apiVersion: configuration.stripe.version,
    });

    const metadataKey = catalog.metadataKey || "convex_stripe_key";
    const behavior = {
      onExisting: catalog.behavior?.onExisting || "update",
      onMissingKey: catalog.behavior?.onMissingKey || "create",
    } as { onExisting: OnExistingBehavior; onMissingKey: OnMissingKeyBehavior };

    const existingProducts = await stripe.products
      .list({ limit: 100 })
      .autoPagingToArray({ limit: 10_000 });

    const existingPrices = await stripe.prices
      .list({ limit: 100 })
      .autoPagingToArray({ limit: 10_000 });

    const productIdsByKey = new Map<string, string>();

    for (const product of products) {
      const key = getProductKey(product, metadataKey);
      if (!key && behavior.onMissingKey === "error")
        throw new Error(
          "[STRIPE SYNC CATALOG] Product is missing a stable key. Provide metadata or name.",
        );

      const existing = pickExistingProduct(
        product,
        metadataKey,
        existingProducts,
      );

      const createParams: Stripe.ProductCreateParams = {
        ...product,
        metadata: buildMetadata(product.metadata, metadataKey, key),
      };

      if (existing) {
        if (behavior.onExisting === "skip") {
          productIdsByKey.set(key || existing.id, existing.id);
          continue;
        }
        if (behavior.onExisting === "error")
          throw new Error(
            `[STRIPE SYNC CATALOG] Product already exists: ${existing.id}`,
          );

        if (behavior.onExisting === "archive_and_recreate") {
          await stripe.products.update(existing.id, { active: false });
          const created = await stripe.products.create(createParams);
          productIdsByKey.set(key || created.id, created.id);
          console.info(
            `[STRIPE SYNC CATALOG] Product archived and recreated: ${created.id}`,
          );
          continue;
        }

        await stripe.products.update(
          existing.id,
          pickProductUpdateParams(createParams),
        );
        productIdsByKey.set(key || existing.id, existing.id);
        console.info(`[STRIPE SYNC CATALOG] Product updated: ${existing.id}`);
        continue;
      }

      if (!key && behavior.onMissingKey === "error")
        throw new Error(
          "[STRIPE SYNC CATALOG] Product key is missing and onMissingKey is set to error.",
        );

      const created = await stripe.products.create(createParams);
      productIdsByKey.set(key || created.id, created.id);
      console.info(`[STRIPE SYNC CATALOG] Product created: ${created.id}`);
    }

    for (const price of prices) {
      const key = getPriceKey(price, metadataKey);
      if (!key && behavior.onMissingKey === "error")
        throw new Error(
          "[STRIPE SYNC CATALOG] Price is missing a stable key. Provide lookup_key or metadata.",
        );

      const existing = pickExistingPrice(price, metadataKey, existingPrices);

      const resolvedPrice = resolveProductIdForPrice(price, productIdsByKey);
      const createParams: Stripe.PriceCreateParams = {
        ...resolvedPrice,
        metadata: buildMetadata(resolvedPrice.metadata, metadataKey, key),
      };

      if (existing) {
        if (behavior.onExisting === "skip") continue;
        if (behavior.onExisting === "error")
          throw new Error(
            `[STRIPE SYNC CATALOG] Price already exists: ${existing.id}`,
          );

        if (behavior.onExisting === "archive_and_recreate") {
          await stripe.prices.update(existing.id, { active: false });
          const created = await stripe.prices.create(createParams);
          console.info(
            `[STRIPE SYNC CATALOG] Price archived and recreated: ${created.id}`,
          );
          continue;
        }

        await stripe.prices.update(
          existing.id,
          pickPriceUpdateParams(createParams),
        );
        console.info(`[STRIPE SYNC CATALOG] Price updated: ${existing.id}`);
        continue;
      }

      if (!key && behavior.onMissingKey === "error")
        throw new Error(
          "[STRIPE SYNC CATALOG] Price key is missing and onMissingKey is set to error.",
        );

      const created = await stripe.prices.create(createParams);
      console.info(`[STRIPE SYNC CATALOG] Price created: ${created.id}`);
    }
  },
});
