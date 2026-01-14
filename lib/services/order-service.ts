import { unauthenticated } from "../../app/shopify.server";

interface TrackOrderParams {
  shop: string;
  orderId?: string;
  orderNumber?: string;
  email?: string;
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

const TRACK_ORDER_BY_NAME_QUERY = `
  query trackOrderByName($query: String!) {
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
class OrderService {
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
      const res = await admin.graphql(TRACK_ORDER_BY_NAME_QUERY, {
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

  private formatTracking(order: any) {
    const fulfillments = order.fulfillments ?? [];

    return {
      orderNumber: order.name?.replace("#", "") ?? null,
      confirmationNumber: order.confirmationNumber ?? null,
      email: order.email ?? null,
      createdAt: order.createdAt ?? null,
      fulfillmentStatus: order.displayFulfillmentStatus ?? null,

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
