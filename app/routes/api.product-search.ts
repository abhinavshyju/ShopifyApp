import type { ActionFunctionArgs } from "react-router";
import { successResponse, errorResponse } from "../../lib/utils/api-response";
import { validateApiKey } from "../../lib/utils/validate-api-key";
import shopifyTokenService from "../../lib/services/shopify-token-service";
import { apiVersion } from "../shopify.server";
import axios from "axios";

interface ProductSearchRequest {
  shop: string;
  searchQuery: string;
}

const SEARCH_PRODUCTS_QUERY = `
  query searchProducts($query: String!) {
    products(first: 25, query: $query) {
      edges {
        node {
          id
          title
          description
          handle
          status
          totalInventory
          priceRangeV2 {
            minVariantPrice {
              amount
              currencyCode
            }
            maxVariantPrice {
              amount
              currencyCode
            }
          }
          featuredImage {
            url
            altText
          }
        }
      }
    }
  }
`;

export const action = async ({ request }: ActionFunctionArgs) => {
  if (request.method !== "POST") {
    return errorResponse("Method not allowed", 405);
  }

  try {
    const authError = validateApiKey(request);
    if (authError) {
      return authError;
    }

    const body = await request.json().catch(() => ({}));
    const { shop, searchQuery } = body as ProductSearchRequest;

    if (!shop) {
      return errorResponse("Shop is required", 400);
    }

    if (!searchQuery) {
      return errorResponse("Search query is required", 400);
    }

    const { accessToken } = await shopifyTokenService.getValidAccessTokenByShop(
      {
        shop,
      },
    );

    const graphqlUrl = `https://${shop}/admin/api/${apiVersion}/graphql.json`;

    const response = await axios.post(
      graphqlUrl,
      {
        query: SEARCH_PRODUCTS_QUERY,
        variables: {
          query: searchQuery,
        },
      },
      {
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Access-Token": accessToken,
        },
      },
    );

    if (response.data.errors) {
      return errorResponse(
        response.data.errors[0]?.message || "GraphQL query failed",
        400,
      );
    }

    const products =
      response.data.data?.products?.edges?.map(
        (edge: { node: unknown }) => edge.node,
      ) || [];

    return successResponse(
      { products, count: products.length },
      "Products retrieved successfully",
    );
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to search products";
    const statusCode = (error as { status?: number })?.status ?? 500;

    return errorResponse(errorMessage, statusCode);
  }
};
