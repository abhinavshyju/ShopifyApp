import type { ActionFunctionArgs } from "react-router";
import { successResponse, errorResponse } from "../../lib/utils/api-response";
import { validateApiKey } from "../../lib/utils/validate-api-key";
import orderService from "../../lib/services/order-service";

interface ChangeShipmentAddressRequest {
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
    const { shop, orderId, shippingAddress } =
      body as ChangeShipmentAddressRequest;

    if (!shop) {
      return errorResponse("Shop is required", 400);
    }

    if (!orderId) {
      return errorResponse("Order ID is required", 400);
    }

    if (!shippingAddress) {
      return errorResponse("Shipping address is required", 400);
    }

    const result = await orderService.updateShippingAddress({
      shop,
      orderId,
      shippingAddress,
    });

    return successResponse(
      result,
      "Shipping address updated successfully",
    );
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Failed to update shipping address";
    const statusCode = (error as { status?: number })?.status ?? 500;

    return errorResponse(errorMessage, statusCode);
  }
};

