import type { ActionFunctionArgs } from "react-router";
import { successResponse, errorResponse } from "../../lib/utils/api-response";
import { validateApiKey } from "../../lib/utils/validate-api-key";
import orderService from "../../lib/services/order-service";

interface CancelOrderRequest {
  shop: string;
  orderId: string;
  reason?: "CUSTOMER" | "DECLINED" | "FRAUD" | "INVENTORY" | "OTHER";
  restock?: boolean;
  notifyCustomer?: boolean;
  staffNote?: string;
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
    const { shop, orderId, reason, restock, notifyCustomer, staffNote } =
      body as CancelOrderRequest;

    if (!shop) {
      return errorResponse("Shop is required", 400);
    }

    if (!orderId) {
      return errorResponse("Order ID is required", 400);
    }

    if (restock !== undefined && typeof restock !== "boolean") {
      return errorResponse("Restock must be a boolean", 400);
    }

    const cancellationReason = reason || "CUSTOMER";

    const shouldRestock = restock ?? false;

    const validReasons = [
      "CUSTOMER",
      "DECLINED",
      "FRAUD",
      "INVENTORY",
      "OTHER",
    ];
    if (!validReasons.includes(cancellationReason)) {
      return errorResponse(
        `Invalid reason. Must be one of: ${validReasons.join(", ")}`,
        400,
      );
    }

    const result = await orderService.cancelOrder({
      shop,
      orderId,
      reason: cancellationReason,
      restock: shouldRestock,
      notifyCustomer,
      staffNote,
    });

    return successResponse(result, "Order cancellation initiated successfully");
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to cancel order";
    const statusCode = (error as { status?: number })?.status ?? 500;

    return errorResponse(errorMessage, statusCode);
  }
};
