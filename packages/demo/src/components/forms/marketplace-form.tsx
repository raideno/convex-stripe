import { api } from "@/convex/api";
import { Card } from "@radix-ui/themes";
import { useQuery } from "convex/react";
import React from "react";

export interface MarketplaceProps {}

export const Marketplace: React.FC<MarketplaceProps> = () => {
  const products = useQuery(api.marketplace.products);

  if (products === undefined) {
    return <div>Loading...</div>;
  }

  console.log("[products]:", products);

  return (
    <div>
      <h1>Marketplace</h1>
      <div>Button to add a new product.</div>
      <div>List products from all sellers.</div>
      <div>
        {products.map((product) => {
          return (
            <Card key={product._id}>
              <div>AccountId: {product.accountId || "Root"}</div>
              <div>{product.stripe.name}</div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
