import type { ActionFunctionArgs } from "react-router";
import { successResponse, errorResponse } from "../../lib/utils/api-response";
import { validateApiKey } from "../../lib/utils/validate-api-key";
import orderService from "../../lib/services/order-service";

interface RefundOrderRequest {
  shop: string;
  orderId?: string;
  orderNumber?: string;
  note?: string;
  fullRefund?: boolean;
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
      note,
      fullRefund = true,
    } = body as RefundOrderRequest;

    if (!shop) {
      return errorResponse("Shop is required", 400);
    }

    if (!orderId && !orderNumber) {
      return errorResponse("Either orderId or orderNumber is required", 400);
    }

    const result = await orderService.createRefund({
      shop,
      orderId,
      orderNumber,
      note,
      shipping: fullRefund ? { fullRefund: true } : undefined,
    });

    return successResponse(result);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to create refund";
    const statusCode = (error as { status?: number })?.status ?? 500;

    return errorResponse(errorMessage, statusCode);
  }
};
