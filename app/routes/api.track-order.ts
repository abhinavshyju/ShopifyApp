import type { ActionFunctionArgs } from "react-router";
import { successResponse, errorResponse } from "../../lib/utils/api-response";
import { validateApiKey } from "../../lib/utils/validate-api-key";
import orderService from "../../lib/services/order-service";

interface TrackOrderRequest {
  shop: string;
  orderId?: string;
  orderNumber?: string;
  email?: string;
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
    const { shop, orderId, orderNumber, email } = body as TrackOrderRequest;

    if (!shop) {
      return errorResponse("Shop is required", 400);
    }

    const result = await orderService.trackOrder({
      shop,
      orderId,
      orderNumber,
      email,
    });

    // If result is an array, it means all orders were returned
    if (Array.isArray(result)) {
      return successResponse(
        { orders: result, count: result.length },
        `${result.length} orders retrieved successfully`,
      );
    }

    // Otherwise, it's a single order
    return successResponse(result, "Order retrieved successfully");
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to track order";
    const statusCode = (error as { status?: number })?.status ?? 500;

    return errorResponse(errorMessage, statusCode);
  }
};
