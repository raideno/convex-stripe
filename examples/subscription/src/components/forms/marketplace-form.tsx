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
  Text,
} from "@radix-ui/themes";
import { useAction, useQuery } from "convex/react";
import React from "react";
import { toast } from "sonner";
import { faker } from "@faker-js/faker";
import { currencyToSymbol } from "./subscription-form";
import { ConvexError } from "convex/values";

const Account = () => {
  const [isLoading, setIsLoading] = React.useState(false);

  const account = useQuery(api.marketplace.account);
  const createProduct = useAction(api.marketplace.createProduct);
  const setup = useAction(api.marketplace.setup);

  const handleProductCreation = async () => {
    try {
      setIsLoading(true);

      // TODO: give random names
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

  const handleSetup = async () => {
    try {
      setIsLoading(true);

      // TODO: fix, account_update isn't working
      // const type = account ? "account_update" : "account_onboarding";
      const type = account ? "account_onboarding" : "account_onboarding";

      const link = await setup({ type });

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

  if (
    account === null
    // ||
    // !account.stripe.charges_enabled ||
    // !account.stripe.payouts_enabled
  ) {
    return (
      <Button loading={isLoading} variant="classic" onClick={handleSetup}>
        Setup Seller Account
      </Button>
    );
  }

  return (
    <Flex direction={"row"} align={"center"} gap="2">
      <Button variant="outline" disabled>
        {account.stripe.id}
      </Button>
      <Button variant="classic" onClick={handleProductCreation}>
        Create Product
      </Button>
    </Flex>
  );
};

export interface MarketplaceProps {}

export const Marketplace: React.FC<MarketplaceProps> = () => {
  const products = useQuery(api.marketplace.products);

  if (products === undefined) {
    return <div>Loading...</div>;
  }

  return (
    <Box>
      <Flex direction="column" gap="4">
        <Flex justify={"between"}>
          <Heading size={"6"}>Products Marketplace</Heading>
          <Account />
        </Flex>
        <Grid
          columns={{ initial: "1", sm: "2", md: "3" }}
          justify={"between"}
          gap="4"
        >
          {products
            .filter(
              (product) => !product.stripe.default_price?.stripe.recurring,
            )
            .sort((p1, p2) => {
              if (!p1.accountId && p2.accountId) return -1;
              if (p1.accountId && !p2.accountId) return 1;
              return 0;
            })
            .map((product) => {
              return (
                <Card
                  key={product._id}
                  className="overflow-hidden cursor-pointer"
                >
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
                        {(product.stripe.default_price?.stripe.unit_amount ||
                          0) / 100}
                        {
                          currencyToSymbol[
                            product.stripe.default_price?.stripe.currency ||
                              "unknown"
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
                </Card>
              );
            })}
        </Grid>
      </Flex>
    </Box>
  );
};
