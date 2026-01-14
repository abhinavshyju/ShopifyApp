import type { ActionFunctionArgs } from "react-router";
import shopifyTokenService from "../../lib/services/shopify-token-service";
import { successResponse, errorResponse } from "../../lib/utils/api-response";
import { validateApiKey } from "../../lib/utils/validate-api-key";
import db from "../db.server";
import type {
  MagicalCXRefreshTokenRequest,
  MagicalCXRefreshTokenResponse,
} from "../../lib/types/magicalcx";

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
    const { shop } = body as MagicalCXRefreshTokenRequest;
    if (!shop) {
      return errorResponse("Shop parameter is required in request body", 400);
    }
    const session = await db.session.findFirst({
      where: { shop, isOnline: false },
    });
    if (!session) {
      return errorResponse(`Session not found for shop: ${shop}`, 404);
    }

    if (
      session.refreshTokenExpires &&
      new Date(session.refreshTokenExpires) <= new Date()
    ) {
      return errorResponse(
        `Refresh token expired for shop: ${shop}. Re-authentication required.`,
        401,
      );
    }

    const tokenInfo = await shopifyTokenService.refreshAccessTokenByShop({
      shop,
    });

    const response: MagicalCXRefreshTokenResponse = {
      accessToken: tokenInfo.accessToken,
      accessTokenExpiresAt: tokenInfo.expiresAt?.toISOString() ?? null,
      shop: session.shop,
    };

    return successResponse<MagicalCXRefreshTokenResponse>(
      response,
      "Token retrieved successfully",
    );
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Failed to refresh Shopify access token";
    const statusCode = (error as { status?: number })?.status ?? 500;

    return errorResponse(errorMessage, statusCode);
  }
};
