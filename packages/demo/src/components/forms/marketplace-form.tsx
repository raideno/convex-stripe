import { api } from "@/convex/api";
import {
  Badge,
  Box,
  Button,
  Card,
  Flex,
  Grid,
  Heading,
} from "@radix-ui/themes";
import { useAction, useQuery } from "convex/react";
import React from "react";
import { toast } from "sonner";
import { faker } from "@faker-js/faker";

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
      });

      toast.success("Product created successfully.");
    } catch {
      toast.error("Failed to create product.");
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
      <Badge>{account.stripe.id}</Badge>
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

  console.log("[products]:", products);

  /**
   * TODO: stripe connect plan
   *
   * 1. First propose to create an account if not already.
   * 2. If an account is available, show the create product button.
   */

  return (
    <Box>
      <Flex direction="column" gap="4">
        <Flex justify={"between"}>
          <Heading size={"6"}>Marketplace</Heading>
          <Account />
        </Flex>
        <Grid
          columns={{ initial: "1", sm: "2", md: "3" }}
          justify={"between"}
          gap="4"
        >
          {products.map((product) => {
            return (
              <Card key={product._id}>
                <div>AccountId: {product.accountId || "Root"}</div>
                <div>{product.stripe.name}</div>
              </Card>
            );
          })}
        </Grid>
      </Flex>
    </Box>
  );
};
