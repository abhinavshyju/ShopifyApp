import type { ActionFunctionArgs } from "react-router";
import { successResponse, errorResponse } from "../../lib/utils/api-response";

import db from "../db.server";
import connectionService from "../../lib/services/connection-service";
import shopifyTokenService from "lib/services/shopify-token-service";

export const action = async ({ request }: ActionFunctionArgs) => {
  if (request.method !== "POST") {
    return errorResponse("Method not allowed", 405);
  }
  try {
    const formData = await request.formData();
    const apiKey = formData.get("apiKey") as string | null;
    if (!apiKey) {
      return errorResponse("API key is required", 400);
    }
    const { accessToken, shop } = await shopifyTokenService.getValidAccessToken(
      {
        request,
      },
    );

    const fullSession = await db.session.findFirst({
      where: { shop, isOnline: false },
    });

    if (!fullSession) {
      return errorResponse("Session not found", 404);
    }
    const payload = {
      apiKey: apiKey,
      shop: fullSession.shop,
      accessToken: accessToken,
      accessTokenExpiresAt: fullSession.expires?.toISOString() ?? null,
    };

    const result = await connectionService.connectToMagicalCX(payload);
    if (result.success && result.data) {
      await db.magicalCXConnection.upsert({
        where: { shop: fullSession.shop },
        update: {
          workspaceId: String(result.data.wid),
          workspaceName: result.data.workspaceName,
          status: result.data.status,
          apiKey: apiKey,
          updatedAt: new Date(),
        },
        create: {
          shop: fullSession.shop,
          workspaceId: String(result.data.wid),
          workspaceName: result.data.workspaceName,
          status: result.data.status,
          apiKey: apiKey,
        },
      });
    }

    return successResponse(
      { ...result, apiKey: apiKey },
      "Successfully connected to MagicalCX",
    );
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to connect to MagicalCX";
    const statusCode = (error as { status?: number })?.status ?? 500;

    return errorResponse(errorMessage, statusCode);
  }
};
