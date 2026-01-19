import type { ActionFunctionArgs } from "react-router";
import { successResponse, errorResponse } from "../../lib/utils/api-response";
import { validateApiKey } from "../../lib/utils/validate-api-key";
import orderService from "../../lib/services/order-service";

interface ReturnRequestOrderRequest {
  shop: string;
  orderId?: string;
  orderNumber?: string;
  returnLineItems?: Array<{
    fulfillmentLineItemId: string;
    quantity: number;
    returnReasonDefinitionId?: string;
    customerNote?: string;
  }>;
  returnShippingFee?: {
    amount: {
      amount: string;
      currencyCode: string;
    };
  };
}

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
    const {
      shop,
      orderId,
      orderNumber,
      returnLineItems,
      returnShippingFee,
    } = body as ReturnRequestOrderRequest;

    if (!shop) {
      return errorResponse("Shop is required", 400);
    }

    if (!orderId && !orderNumber) {
      return errorResponse("Either orderId or orderNumber is required", 400);
    }

    const result = await orderService.createReturnRequest({
      shop,
      orderId,
      orderNumber,
      returnLineItems,
      returnShippingFee,
    });

    return successResponse(result);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to create return request";
    const statusCode = (error as { status?: number })?.status ?? 500;

    return errorResponse(errorMessage, statusCode);
  }
};
