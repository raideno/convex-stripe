import { api } from "@/convex/api";
import {
  AspectRatio,
  Badge,
  Box,
  Button,
  Card,
  Flex,
  Grid,
  Heading,
  Spinner,
  Text,
} from "@radix-ui/themes";
import { useAction, useQuery } from "convex/react";
import React from "react";
import { toast } from "sonner";
import { faker } from "@faker-js/faker";
import { currencyToSymbol } from "./subscription-form";
import { ConvexError } from "convex/values";
import { FunctionReturnType } from "convex/server";

const Account = () => {
  const [isLoading, setIsLoading] = React.useState(false);

  const account = useQuery(api.marketplace.accounts.self);
  const capabilities = useQuery(api.marketplace.capabilities.list);
  const createProduct = useAction(api.marketplace.products.create);
  const setup = useAction(api.marketplace.accounts.setup);
  const requestCapabilities = useAction(api.marketplace.capabilities.request);

  const handleProductCreation = async () => {
    try {
      setIsLoading(true);

      await createProduct({
        name: faker.commerce.productName(),
        description: faker.commerce.productDescription(),
        price:
          parseFloat(faker.commerce.price({ min: 1000, max: 10000, dec: 0 })) ||
          1000,
        images: [faker.image.url({ width: 480, height: 480 })],
      });

      toast.success("Product created successfully.");
    } catch (error: unknown) {
      if (error instanceof ConvexError) {
        toast.error(error.data);
      } else {
        toast.error("Failed to create product.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestCapabilities = async () => {
    try {
      setIsLoading(true);
      await requestCapabilities({});
      toast.success(
        "Capabilities requested. This may take a moment to activate.",
      );
    } catch {
      toast.error("Failed to request capabilities.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetup = async () => {
    try {
      setIsLoading(true);

      const link = await setup({});

      window.location.href = link.url;

      toast.success("Account setup initiated. You'll be redirected soon.");
    } catch {
      toast.error("Failed to setup account.");
    } finally {
      setIsLoading(false);
    }
  };

  if (account === undefined) {
    return (
      <div>
        <div>Loading...</div>
      </div>
    );
  }

  console.log("[account]:", account);

  if (account === null) {
    return (
      <Badge size="2" color="orange">
        Setup Seller Account
      </Badge>
    );
  }

  if (!account.stripe.charges_enabled || !account.stripe.payouts_enabled) {
    return (
      <Flex direction={"row"} align={"center"} gap="2">
        <Button variant="outline" disabled>
          {account.stripe.id}
        </Button>
        <Button loading={isLoading} variant="classic" onClick={handleSetup}>
          Continue Account Setup
        </Button>
      </Flex>
    );
  }

  const cardPaymentsStatus = capabilities?.cardPayments?.stripe.status;
  const transfersStatus = capabilities?.transfers?.stripe.status;

  const capabilitiesActive =
    cardPaymentsStatus === "active" && transfersStatus === "active";

  const capabilitiesPending =
    !capabilitiesActive &&
    (cardPaymentsStatus === "pending" || transfersStatus === "pending");

  const capabilitiesUnrequested =
    !capabilitiesActive &&
    !capabilitiesPending &&
    (cardPaymentsStatus === "unrequested" ||
      transfersStatus === "unrequested" ||
      capabilities?.cardPayments === null ||
      capabilities?.transfers === null);

  if (capabilitiesPending) {
    return (
      <Flex direction={"row"} align={"center"} gap="2">
        <Button variant="outline" disabled>
          {account.stripe.id}
        </Button>
        <Button variant="classic" disabled>
          <Spinner />
          Capabilities Pending Approval
        </Button>
      </Flex>
    );
  }

  if (capabilitiesUnrequested) {
    return (
      <Flex direction={"row"} align={"center"} gap="2">
        <Button variant="outline" disabled>
          {account.stripe.id}
        </Button>
        <Button
          loading={isLoading}
          variant="classic"
          color="orange"
          onClick={handleRequestCapabilities}
        >
          Enable Payments
        </Button>
      </Flex>
    );
  }

  return (
    <Flex direction={"row"} align={"center"} gap="2">
      <Button variant="outline" disabled>
        {account.stripe.id}
      </Button>
      <Button
        loading={isLoading}
        variant="classic"
        onClick={handleProductCreation}
      >
        Create Product
      </Button>
    </Flex>
  );
};

interface ProductGroup {
  accountId: string | null;
  accountLabel: string;
  products: FunctionReturnType<typeof api.stripe.products>[number][];
}

export interface MarketplaceProps {}

export const Marketplace: React.FC<MarketplaceProps> = () => {
  const products = useQuery(api.stripe.products);
  const buy = useAction(api.stripe.pay);

  const handleBuyButtonClick = async (
    price: NonNullable<
      ProductGroup["products"][number]["stripe"]["default_price"]
    >,
  ) => {
    try {
      const response = await buy({
        priceId: price.stripe.id,
        accountId: price.accountId,
      });

      if (response.url) {
        toast.loading("Redirecting to checkout...");
        window.location.href = response.url;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (error) {
      toast.error("Failed to initiate purchase.");
    }
  };

  if (products === undefined) {
    return <div>Loading...</div>;
  }

  const filteredProducts = products.filter(
    (product) => !product.stripe.default_price?.stripe.recurring,
  );

  const groupedProducts = filteredProducts.reduce<Record<string, ProductGroup>>(
    (acc, product) => {
      const key = product.accountId || "root";
      const accountLabel = product.accountId || "Root Account";

      if (!acc[key]) {
        acc[key] = {
          accountId: product.accountId || null,
          accountLabel,
          products: [],
        };
      }

      acc[key].products.push(product);
      return acc;
    },
    {},
  );

  const sortedGroups = Object.values(groupedProducts).sort((a, b) => {
    if (a.accountId === null) return -1;
    if (b.accountId === null) return 1;
    return (a.accountId || "").localeCompare(b.accountId || "");
  });

  return (
    <Box>
      <Flex direction="column" gap="4">
        <Flex justify={"between"}>
          <Heading size={"6"}>Products Marketplace</Heading>
          <Account />
        </Flex>

        {sortedGroups.map((group) => (
          <Flex key={group.accountId || "root"} direction="column" gap="3">
            <Heading size="4">{group.accountLabel}</Heading>
            <Grid
              columns={{ initial: "1", sm: "2", md: "3" }}
              justify={"between"}
              gap="4"
            >
              {group.products
                .filter((product) => product.stripe.default_price)
                .map((product) => {
                  return (
                    <Card
                      key={product._id}
                      className="overflow-hidden cursor-pointer"
                    >
                      <Flex direction={"column"} gap={"2"}>
                        <AspectRatio
                          ratio={1 / 1}
                          className="relative rounded overflow-hidden"
                        >
                          <img
                            className="w-full h-full object-cover bg-gray-200 brightness-50"
                            src={product.stripe.images[0]}
                            alt={product.stripe.name}
                          />

                          {/* Gradient overlay */}
                          <div className="absolute inset-0 bg-linear-to-t from-black via-transparent to-transparent" />

                          {/* Content overlay */}
                          <Box
                            position="absolute"
                            bottom="0"
                            left="0"
                            right="0"
                            className="p-4"
                          >
                            <Text>
                              {(product.stripe.default_price!.stripe
                                .unit_amount || 0) / 100}
                              {
                                currencyToSymbol[
                                  product.stripe.default_price!.stripe
                                    .currency || "unknown"
                                ]
                              }
                            </Text>
                            <Heading
                              size="4"
                              weight="bold"
                              className="mb-2 line-clamp-1"
                            >
                              {product.stripe.name}
                            </Heading>

                            <Badge color="blue" variant="soft">
                              {product.accountId || "Root Account"}
                            </Badge>
                          </Box>
                        </AspectRatio>
                        <Button
                          variant="classic"
                          className="w-full!"
                          onClick={handleBuyButtonClick.bind(
                            null,
                            product.stripe.default_price!,
                          )}
                        >
                          Buy
                        </Button>
                      </Flex>
                    </Card>
                  );
                })}
            </Grid>
          </Flex>
        ))}
      </Flex>
    </Box>
  );
};
