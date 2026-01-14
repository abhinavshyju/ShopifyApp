import type { ActionFunctionArgs } from "react-router";
import { successResponse, errorResponse } from "../../lib/utils/api-response";
import { validateApiKey } from "../../lib/utils/validate-api-key";
import db from "../db.server";
import connectionService from "../../lib/services/connection-service";
import shopifyTokenService from "lib/services/shopify-token-service";

export const action = async ({ request }: ActionFunctionArgs) => {
  if (request.method === "DELETE") {
    try {
      const { shop } = await shopifyTokenService.getValidAccessToken({
        request,
      });
      const fullSession = await db.session.findFirst({
        where: { shop, isOnline: false },
      });
      if (!fullSession) {
        return errorResponse("Session not found", 404);
      }
      const connection = await connectionService.getConnectionInfo({
        shop: fullSession.shop,
      });
      if (!connection) {
        return errorResponse("Connection not found", 404);
      }

      await connectionService.disconnectFromMagicalCX({
        shop: fullSession.shop,
        wid: connection.workspaceId,
      });

      await db.magicalCXConnection.delete({
        where: { shop: fullSession.shop },
      });
      return successResponse("Connection deleted");
    } catch (error) {
      return errorResponse("Failed to delete connection" + error, 500);
    }
  }
  if (request.method === "POST") {
    try {
      const authError = validateApiKey(request);
      if (authError) {
        return authError;
      }
      const body = await request.json().catch(() => ({}));
      const { shop, wid } = body as { shop: string; wid: string };
      if (!shop) {
        return errorResponse("Shop parameter is required in request body", 400);
      }
      const session = await db.session.findFirst({
        where: { shop, isOnline: false },
      });
      if (!session) {
        return errorResponse(`Session not found for shop: ${shop}`, 404);
      }
      const connection = await connectionService.getConnectionInfo({
        shop: session.shop,
      });
      if (!connection) {
        return errorResponse("Connection not found", 404);
      }
      if (connection.workspaceId !== wid) {
        return errorResponse("Workspace ID mismatch", 400);
      }
      await db.magicalCXConnection.delete({
        where: { shop: session.shop },
      });
      return successResponse("Connection deleted");
    } catch (error) {
      return errorResponse("Failed to delete connection", 500);
    }
  }
  return errorResponse("Method not allowed", 405);
};
