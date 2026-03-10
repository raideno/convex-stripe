import {
  Badge,
  Box,
  Card,
  Flex,
  Heading,
  IconButton,
  Link,
  Skeleton,
  Table,
} from "@radix-ui/themes";
import { useQuery } from "convex/react";

import { api } from "@/convex/api";
import { ExternalLinkIcon } from "@radix-ui/react-icons";
import { currencyToSymbol } from "./subscription-form";

export const PaymentsForm = () => {
  const products = useQuery(api.stripe.products);
  const payments = useQuery(api.stripe.payments);

  if (payments === undefined || products === undefined)
    return (
      <>
        <Skeleton style={{ width: "100%", height: "102px" }} />
      </>
    );

  return (
    <Box>
      <Flex direction={"column"} gap="4">
        <Heading size={"6"}>Payments</Heading>
        <Box>
          <Card style={{ padding: 0 }}>
            <Table.Root>
              <Table.Header>
                <Table.Row>
                  <Table.ColumnHeaderCell>Link</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell align="right">
                    Amount
                  </Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell align="center">
                    Status
                  </Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell align="center">
                    Mode
                  </Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>Date</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell align="center">
                    AccountId
                  </Table.ColumnHeaderCell>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {payments.length === 0 && (
                  <Table.Row>
                    <Table.Cell colSpan={5} className="text-center">
                      No payments found.
                    </Table.Cell>
                  </Table.Row>
                )}
                {payments.map((payment) => {
                  return (
                    <Table.Row key={payment._id}>
                      <Table.Cell>
                        <Link href={payment.stripe.url || "#"}>
                          <IconButton
                            disabled={!payment.stripe.url}
                            variant="ghost"
                            size="2"
                          >
                            <ExternalLinkIcon />
                          </IconButton>
                        </Link>
                      </Table.Cell>
                      <Table.Cell align="right">
                        {((payment.stripe.amount_total || 0) / 100).toFixed(2)}{" "}
                        {payment.stripe.currency
                          ? currencyToSymbol[payment.stripe.currency]
                          : "x"}
                      </Table.Cell>
                      <Table.Cell align="center">
                        <Badge
                          color={
                            payment.stripe.payment_status === "paid"
                              ? "green"
                              : "red"
                          }
                        >
                          {payment.stripe.payment_status}
                        </Badge>
                      </Table.Cell>
                      <Table.Cell align="center">
                        <Badge
                          color={
                            payment.stripe.mode === "payment" ? "blue" : "cyan"
                          }
                        >
                          {payment.stripe.mode}
                        </Badge>
                      </Table.Cell>
                      <Table.Cell>
                        {new Date(
                          payment.stripe.created * 1000,
                        ).toLocaleDateString()}{" "}
                        -{" "}
                        {new Date(
                          payment.stripe.created * 1000,
                        ).toLocaleTimeString()}
                      </Table.Cell>
                      <Table.Cell align="center">
                        <Badge color="gray">
                          {payment.accountId || "Root"}
                        </Badge>
                      </Table.Cell>
                    </Table.Row>
                  );
                })}
              </Table.Body>
            </Table.Root>
          </Card>
        </Box>
      </Flex>
    </Box>
  );
};
