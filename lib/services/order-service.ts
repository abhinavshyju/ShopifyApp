import { unauthenticated } from "../../app/shopify.server";

interface TrackOrderParams {
  shop: string;
  orderId?: string;
  orderNumber?: string;
  email?: string;
}

interface CancelOrderParams {
  shop: string;
  orderId?: string;
  orderNumber?: string;
  reason: "CUSTOMER" | "DECLINED" | "FRAUD" | "INVENTORY" | "OTHER";
  restock: boolean;
  notifyCustomer?: boolean;
  staffNote?: string;
}

interface UpdateShippingAddressParams {
  shop: string;
  orderId: string;
  shippingAddress: {
    firstName?: string;
    lastName?: string;
    address1?: string;
    address2?: string;
    city?: string;
    provinceCode?: string;
    countryCode?: string;
    zip?: string;
    phone?: string;
    company?: string;
  };
}

interface CreateReturnParams {
  shop: string;
  orderId?: string;
  orderNumber?: string;
  returnLineItems?: Array<{
    fulfillmentLineItemId: string;
    quantity: number;
    returnReasonNote?: string;
  }>;
  returnReasonNote?: string;
  notifyCustomer?: boolean;
}

interface CreateRefundParams {
  shop: string;
  orderId?: string;
  orderNumber?: string;
  refundLineItems?: Array<{
    lineItemId: string;
    quantity: number;
    restockType?: "CANCEL" | "NO_RESTOCK" | "RETURN";
    locationId?: string;
  }>;
  shipping?: {
    amount?: string;
    fullRefund?: boolean;
  };
  note?: string;
  notifyCustomer?: boolean;
}

const TRACK_ORDER_BY_ID_QUERY = `
  query trackOrderById($id: ID!) {
    order(id: $id) {
      id
      name
      email
      createdAt
      displayFulfillmentStatus
      confirmationNumber
      cancelledAt
      cancelReason
      closedAt


      subtotalPriceSet {
        shopMoney {
          amount
          currencyCode
        }
      }
      totalShippingPriceSet {
        shopMoney {
          amount
          currencyCode
        }
      }
      totalTaxSet {
        shopMoney {
          amount
          currencyCode
        }
      }
      totalDiscountsSet {
        shopMoney {
          amount
          currencyCode
        }
      }
      totalPriceSet {
        shopMoney {
          amount
          currencyCode
        }
      }

      shippingAddress {
        address1
        address2
        city
        province
        provinceCode
        country
        countryCode
        zip
        firstName
        lastName
        formatted
      }

      fulfillments(first: 10) {
        id
        displayStatus
        createdAt
        updatedAt
        estimatedDeliveryAt
        inTransitAt
        deliveredAt

        trackingInfo(first: 10) {
          company
          number
          url
        }

        location {
          id
          name
          address {
            city
            province
            country
          }
        }

        fulfillmentLineItems(first: 50) {
          edges {
            node {
              id
              quantity
              lineItem {
                id
                title
                originalUnitPriceSet {
                  shopMoney {
                    amount
                    currencyCode
                  }
                }
                discountedUnitPriceSet {
                  shopMoney {
                    amount
                    currencyCode
                  }
                }
                product {
                  id
                  title
                }
                variant {
                  id
                  title
                  sku
                  image {
                    url
                    altText
                  }
                }
              }
            }
          }
        }

        events(first: 50, sortKey: HAPPENED_AT, reverse: true) {
          edges {
            node {
              status
              message
              happenedAt
              city
              province
              country
              latitude
              longitude
            }
          }
        }
      }
    }
  }
`;

const TRACK_ORDER_BY_ORDER_NUMBER = `
  query trackOrderByOrderNumber($query: String!) {
    orders(first: 1, query: $query) {
      edges {
        node {
          ... on Order {
            id
            name
            email
            createdAt
            displayFulfillmentStatus
            confirmationNumber
            cancelledAt
            cancelReason
            closedAt

            subtotalPriceSet {
              shopMoney {
                amount
                currencyCode
              }
            }
            totalShippingPriceSet {
              shopMoney {
                amount
                currencyCode
              }
            }
            totalTaxSet {
              shopMoney {
                amount
                currencyCode
              }
            }
            totalDiscountsSet {
              shopMoney {
                amount
                currencyCode
              }
            }
            totalPriceSet {
              shopMoney {
                amount
                currencyCode
              }
            }

            shippingAddress {
              address1
              address2
              city
              province
              provinceCode
              country
              countryCode
              zip
              firstName
              lastName
              formatted
            }

            fulfillments(first: 10) {
              id
              displayStatus
              createdAt
              updatedAt
              estimatedDeliveryAt
              inTransitAt
              deliveredAt
              trackingInfo(first: 10) {
                company
                number
                url
              }
              location {
                name
                address {
                  city
                  province
                  country
                }
              }
              fulfillmentLineItems(first: 50) {
                edges {
                  node {
                    id
                    quantity
                    lineItem {
                      title
                      originalUnitPriceSet {
                        shopMoney {
                          amount
                          currencyCode
                        }
                      }
                      discountedUnitPriceSet {
                        shopMoney {
                          amount
                          currencyCode
                        }
                      }
                      product {
                        id
                        title
                      }
                      variant {
                        id
                        title
                        sku
                        image {
                          url
                          altText
                        }
                      }
                    }
                  }
                }
              }
              events(first: 50, sortKey: HAPPENED_AT, reverse: true) {
                edges {
                  node {
                    status
                    message
                    happenedAt
                    city
                    province
                    country
                  }
                }
              }
            }
          }
        }
      }
    }
  }
`;

const TRACK_ORDER_BY_EMAIL_QUERY = `
  query trackOrderByEmail($query: String!) {
    orders(first: 1, sortKey: CREATED_AT, reverse: true, query: $query) {
      edges {
        node {
          id
          name
          email
          createdAt
          displayFulfillmentStatus
          confirmationNumber
          cancelledAt
          cancelReason
          closedAt

          subtotalPriceSet { shopMoney { amount currencyCode } }
          totalShippingPriceSet { shopMoney { amount currencyCode } }
          totalTaxSet { shopMoney { amount currencyCode } }
          totalDiscountsSet { shopMoney { amount currencyCode } }
          totalPriceSet { shopMoney { amount currencyCode } }

          shippingAddress {
            address1
            city
            province
            country
            zip
            firstName
            lastName
            formatted
          }

          fulfillments(first: 10) {
            displayStatus
            deliveredAt
            estimatedDeliveryAt
            trackingInfo(first: 10) {
              company
              number
              url
            }
            fulfillmentLineItems(first: 50) {
              edges {
                node {
                  quantity
                  lineItem {
                    title
                    originalUnitPriceSet {
                      shopMoney { amount currencyCode }
                    }
                    discountedUnitPriceSet {
                      shopMoney { amount currencyCode }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
`;

const ORDER_CANCEL_MUTATION = `
  mutation orderCancel($orderId: ID!, $reason: OrderCancelReason!, $restock: Boolean!, $notifyCustomer: Boolean, $staffNote: String) {
    orderCancel(orderId: $orderId, reason: $reason, restock: $restock, notifyCustomer: $notifyCustomer, staffNote: $staffNote) {
      job {
        id
        done
      }
      orderCancelUserErrors {
        field
        message
        code
      }
    }
  }
`;

const ORDER_UPDATE_MUTATION = `
  mutation orderUpdate($input: OrderInput!) {
    orderUpdate(input: $input) {
      order {
        id
        name
        shippingAddress {
          firstName
          lastName
          address1
          address2
          city
          provinceCode
          countryCode
          zip
          phone
          company
        }
      }
      userErrors {
        field
        message
      }
    }
  }
`;

const RETURN_CREATE_MUTATION = `
  mutation returnCreate($returnInput: ReturnInput!) {
    returnCreate(returnInput: $returnInput) {
      return {
        id
        status
        order {
          id
          name
        }
      }
      userErrors {
        field
        message
      }
    }
  }
`;

const REFUND_CREATE_MUTATION = `
  mutation refundCreate($input: RefundInput!) {
    refundCreate(input: $input) {
      refund {
        id
        createdAt
        totalRefundedSet {
          shopMoney {
            amount
            currencyCode
          }
        }
      }
      userErrors {
        field
        message
      }
    }
  }
`;

const ORDER_ID_BY_NUMBER_QUERY = `
  query getOrderIdByNumber($query: String!) {
    orders(first: 1, query: $query) {
      edges {
        node {
          id
        }
      }
    }
  }
`;

class OrderService {
  private resolveOrderId = async ({
    shop,
    orderId,
    orderNumber,
  }: {
    shop: string;
    orderId?: string;
    orderNumber?: string;
  }): Promise<string> => {
    if (orderId) {
      return orderId;
    }

    if (!orderNumber) {
      throw new Error("Either orderId or orderNumber is required");
    }

    const { admin } = await unauthenticated.admin(shop);

    const res = await admin.graphql(ORDER_ID_BY_NUMBER_QUERY, {
      variables: {
        query: `name:${orderNumber}`,
      },
    });

    const json = (await res.json()) as any;
    const resolvedOrderId = json.data?.orders?.edges?.[0]?.node?.id;

    if (!resolvedOrderId) {
      throw new Error(`Order not found with order number: ${orderNumber}`);
    }

    return resolvedOrderId;
  };

  trackOrder = async ({
    shop,
    orderId,
    orderNumber,
    email,
  }: TrackOrderParams) => {
    const { admin } = await unauthenticated.admin(shop);

    if (!orderId && !orderNumber && !email) {
      throw new Error("Provide orderId OR orderNumber OR email");
    }

    if (orderId) {
      const res = await admin.graphql(TRACK_ORDER_BY_ID_QUERY, {
        variables: { id: orderId },
      });

      const json = (await res.json()) as any;
      const order = json.data?.order;

      if (!order) throw new Error("Order not found");

      return this.formatTracking(order);
    }

    if (orderNumber) {
      const res = await admin.graphql(TRACK_ORDER_BY_ORDER_NUMBER, {
        variables: {
          query: `name:${orderNumber}`,
        },
      });

      const json = (await res.json()) as any;
      const order = json.data?.orders?.edges?.[0]?.node;

      if (!order) throw new Error("Order not found");

      return this.formatTracking(order);
    }

    if (email) {
      const res = await admin.graphql(TRACK_ORDER_BY_EMAIL_QUERY, {
        variables: {
          query: `email:${email}`,
        },
      });

      const json = (await res.json()) as any;
      const order = json.data?.orders?.edges?.[0]?.node;

      if (!order) {
        throw new Error("No orders found for this email");
      }

      return this.formatTracking(order);
    }

    throw new Error("Invalid tracking parameters");
  };

  cancelOrder = async ({
    shop,
    orderId,
    orderNumber,
    reason,
    restock,
    notifyCustomer = true,
    staffNote,
  }: CancelOrderParams) => {
    const resolvedOrderId = await this.resolveOrderId({
      shop,
      orderId,
      orderNumber,
    });

    const { admin } = await unauthenticated.admin(shop);

    const res = await admin.graphql(ORDER_CANCEL_MUTATION, {
      variables: {
        orderId: resolvedOrderId,
        reason,
        restock,
        notifyCustomer,
        staffNote: staffNote || null,
      },
    });

    const json = (await res.json()) as any;
    const result = json.data?.orderCancel;

    if (!result) {
      throw new Error("Failed to cancel order");
    }

    if (result.orderCancelUserErrors?.length > 0) {
      const errors = result.orderCancelUserErrors
        .map((e: any) => `${e.field}: ${e.message}`)
        .join(", ");
      throw new Error(`Order cancellation failed: ${errors}`);
    }

    return {
      jobId: result.job?.id ?? null,
      done: result.job?.done ?? false,
    };
  };

  updateShippingAddress = async ({
    shop,
    orderId,
    shippingAddress,
  }: UpdateShippingAddressParams) => {
    const { admin } = await unauthenticated.admin(shop);

    if (!orderId) {
      throw new Error("Order ID is required");
    }

    const res = await admin.graphql(ORDER_UPDATE_MUTATION, {
      variables: {
        input: {
          id: orderId,
          shippingAddress,
        },
      },
    });

    const json = (await res.json()) as any;
    const result = json.data?.orderUpdate;

    if (!result) {
      throw new Error("Failed to update shipping address");
    }

    if (result.userErrors?.length > 0) {
      const errors = result.userErrors
        .map((e: any) => `${e.field}: ${e.message}`)
        .join(", ");
      throw new Error(`Shipping address update failed: ${errors}`);
    }

    return {
      orderId: result.order?.id ?? null,
      orderName: result.order?.name ?? null,
      shippingAddress: result.order?.shippingAddress ?? null,
    };
  };

  createReturn = async ({
    shop,
    orderId,
    orderNumber,
    returnLineItems,
    returnReasonNote,
    notifyCustomer = false,
  }: CreateReturnParams) => {
    const resolvedOrderId = await this.resolveOrderId({
      shop,
      orderId,
      orderNumber,
    });

    const { admin } = await unauthenticated.admin(shop);

    let itemsToReturn = returnLineItems;

    // Auto-fetch all fulfillment line items if not provided
    if (!itemsToReturn || itemsToReturn.length === 0) {
      const orderData = await this.trackOrder({
        shop,
        orderId: resolvedOrderId,
      });

      const allFulfillmentLineItems: Array<{
        fulfillmentLineItemId: string;
        quantity: number;
        returnReasonNote?: string;
      }> = [];

      for (const shipment of orderData.shipments ?? []) {
        for (const product of shipment.products ?? []) {
          if (product.fulfillmentLineItemId && product.quantity > 0) {
            allFulfillmentLineItems.push({
              fulfillmentLineItemId: product.fulfillmentLineItemId,
              quantity: product.quantity,
              returnReasonNote: returnReasonNote || undefined,
            });
          }
        }
      }

      if (allFulfillmentLineItems.length === 0) {
        throw new Error("No fulfilled items available to return");
      }

      itemsToReturn = allFulfillmentLineItems;
    }

    const res = await admin.graphql(RETURN_CREATE_MUTATION, {
      variables: {
        returnInput: {
          orderId: resolvedOrderId,
          returnLineItems: itemsToReturn.map((item) => ({
            fulfillmentLineItemId: item.fulfillmentLineItemId,
            quantity: item.quantity,
            returnReasonNote: item.returnReasonNote || returnReasonNote || null,
          })),
        },
      },
    });

    const json = (await res.json()) as any;
    const result = json.data?.returnCreate;

    if (!result) {
      throw new Error("Failed to create return");
    }

    if (result.userErrors?.length > 0) {
      const errors = result.userErrors
        .map((e: any) => `${e.field}: ${e.message}`)
        .join(", ");
      throw new Error(`Return creation failed: ${errors}`);
    }

    return {
      returnId: result.return?.id ?? null,
      status: result.return?.status ?? null,
      orderId: result.return?.order?.id ?? null,
      orderName: result.return?.order?.name ?? null,
    };
  };

  createRefund = async ({
    shop,
    orderId,
    orderNumber,
    refundLineItems,
    shipping,
    note,
    notifyCustomer = false,
  }: CreateRefundParams) => {
    const resolvedOrderId = await this.resolveOrderId({
      shop,
      orderId,
      orderNumber,
    });

    const { admin } = await unauthenticated.admin(shop);

    const refundInput: any = {
      orderId: resolvedOrderId,
      notify: notifyCustomer,
    };

    if (refundLineItems && refundLineItems.length > 0) {
      refundInput.refundLineItems = refundLineItems.map((item) => ({
        lineItemId: item.lineItemId,
        quantity: item.quantity,
        restockType: item.restockType || null,
        locationId: item.locationId || null,
      }));
    }

    if (shipping) {
      refundInput.shipping = {
        fullRefund: shipping.fullRefund ?? false,
        ...(shipping.amount && { amount: shipping.amount }),
      };
    }

    if (note) {
      refundInput.note = note;
    }

    const res = await admin.graphql(REFUND_CREATE_MUTATION, {
      variables: {
        input: refundInput,
      },
    });

    const json = (await res.json()) as any;
    const result = json.data?.refundCreate;

    if (!result) {
      throw new Error("Failed to create refund");
    }

    if (result.userErrors?.length > 0) {
      const errors = result.userErrors
        .map((e: any) => `${e.field}: ${e.message}`)
        .join(", ");
      throw new Error(`Refund creation failed: ${errors}`);
    }

    return {
      refundId: result.refund?.id ?? null,
      createdAt: result.refund?.createdAt ?? null,
      totalRefunded: result.refund?.totalRefundedSet?.shopMoney ?? null,
    };
  };

  private formatTracking(order: any) {
    const fulfillments = order.fulfillments ?? [];

    return {
      orderId: order.id ?? null,
      orderNumber: order.name?.replace("#", "") ?? null,
      confirmationNumber: order.confirmationNumber ?? null,
      email: order.email ?? null,
      createdAt: order.createdAt ?? null,
      fulfillmentStatus: order.displayFulfillmentStatus ?? null,
      reason: order.cancelReason ?? null,
      cancelled: order.cancelledAt ? true : false,
      cancelledAt: order.cancelledAt ?? null,
      closedAt: order.closedAt ?? null,

      pricing: {
        subtotal: order.subtotalPriceSet?.shopMoney ?? null,
        shipping: order.totalShippingPriceSet?.shopMoney ?? null,
        tax: order.totalTaxSet?.shopMoney ?? null,
        discount: order.totalDiscountsSet?.shopMoney ?? null,
        total: order.totalPriceSet?.shopMoney ?? null,
      },

      shippingAddress: order.shippingAddress ?? null,

      shipments: fulfillments.map((f: any) => ({
        status: f.displayStatus ?? null,
        estimatedDeliveryAt: f.estimatedDeliveryAt ?? null,
        deliveredAt: f.deliveredAt ?? null,

        tracking: {
          company: f.trackingInfo?.[0]?.company ?? null,
          numbers: f.trackingInfo?.map((t: any) => t.number) ?? [],
          urls: f.trackingInfo?.map((t: any) => t.url) ?? [],
        },

        products:
          f.fulfillmentLineItems?.edges?.map((e: any) => {
            const unit =
              e.node.lineItem?.discountedUnitPriceSet?.shopMoney ||
              e.node.lineItem?.originalUnitPriceSet?.shopMoney;

            return {
              fulfillmentLineItemId: e.node.id ?? null,
              title: e.node.lineItem?.title ?? null,
              quantity: e.node.quantity ?? 0,

              pricing: unit
                ? {
                    unitPrice: unit,
                    totalPrice: {
                      amount: (Number(unit.amount) * e.node.quantity).toFixed(
                        2,
                      ),
                      currencyCode: unit.currencyCode,
                    },
                  }
                : null,

              product: e.node.lineItem?.product ?? null,
              variant: e.node.lineItem?.variant ?? null,
            };
          }) ?? [],

        timeline:
          f.events?.edges?.map((e: any) => ({
            status: e.node.status ?? null,
            message: e.node.message ?? null,
            happenedAt: e.node.happenedAt ?? null,
            location: {
              city: e.node.city ?? null,
              province: e.node.province ?? null,
              country: e.node.country ?? null,
            },
          })) ?? [],
      })),
    };
  }
}

const orderService = new OrderService();
export default orderService;
