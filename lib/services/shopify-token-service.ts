import db from "../../app/db.server";
import { authenticate } from "../../app/shopify.server";
import type { Session } from "@shopify/shopify-app-react-router/server";

import axios from "axios";

interface GetValidTokenParams {
  request: Request;
  shop?: string;
}

interface ValidTokenResult {
  accessToken: string;
  session: Session;
  shop: string;
}

class ShopifyTokenService {
  getValidAccessToken = async ({
    request,
  }: GetValidTokenParams): Promise<ValidTokenResult> => {
    const { session } = await authenticate.admin(request);

    if (!session.accessToken) {
      throw new Error("Access token not available after authentication");
    }

    // Fetch the latest session from database to get the refreshed token
    // The authenticate method automatically updates the session in storage if refresh occurred
    const fullSession = await db.session.findUnique({
      where: { id: session.id },
    });

    if (!fullSession) {
      throw new Error("Session not found in database");
    }

    // Use the token from the database as it's the source of truth
    // The authenticate method updates it automatically if refresh was needed
    return {
      accessToken: fullSession.accessToken,
      session: session,
      shop: fullSession.shop,
    };
  };

  getValidAccessTokenByShop = async ({
    shop,
  }: {
    shop: string;
  }): Promise<{ accessToken: string; expiresAt: Date | null }> => {
    const session = await db.session.findFirst({
      where: { shop, isOnline: false },
    });

    if (!session) {
      throw new Error(`No offline session found for shop: ${shop}`);
    }

    if (!session.accessToken) {
      throw new Error(`No access token available for shop: ${shop}`);
    }

    if (
      session.refreshTokenExpires &&
      new Date(session.refreshTokenExpires) <= new Date()
    ) {
      throw new Error(
        `Refresh token expired for shop: ${shop}. Re-authentication required.`,
      );
    }

    const now = new Date();
    const expiresAt = session.expires;
    const needsRefresh =
      expiresAt && new Date(expiresAt.getTime() - 5 * 60 * 1000) <= now;

    if (needsRefresh && session.refreshToken) {
      const tokenInfo = await this.refreshAccessTokenByShop({ shop });
      return {
        accessToken: tokenInfo.accessToken,
        expiresAt: tokenInfo.expiresAt,
      };
    }

    return {
      accessToken: session.accessToken,
      expiresAt: session.expires,
    };
  };

  refreshAccessTokenByShop = async ({
    shop,
  }: {
    shop: string;
  }): Promise<{ accessToken: string; expiresAt: Date | null }> => {
    const session = await db.session.findFirst({
      where: { shop, isOnline: false },
    });

    if (!session) {
      throw new Error(`No offline session found for shop: ${shop}`);
    }

    if (!session.refreshToken) {
      throw new Error(`No refresh token available for shop: ${shop}`);
    }

    if (
      session.refreshTokenExpires &&
      new Date(session.refreshTokenExpires) <= new Date()
    ) {
      throw new Error(
        `Refresh token expired for shop: ${shop}. Re-authentication required.`,
      );
    }

    // Check if token actually needs refresh
    const now = new Date();
    const expiresAt = session.expires;
    const needsRefresh =
      !expiresAt || new Date(expiresAt.getTime() - 5 * 60 * 1000) <= now;

    if (!needsRefresh) {
      return {
        accessToken: session.accessToken,
        expiresAt: session.expires,
      };
    }

    const apiKey = process.env.SHOPIFY_API_KEY;
    const apiSecret = process.env.SHOPIFY_API_SECRET;

    if (!apiKey || !apiSecret) {
      throw new Error("SHOPIFY_API_KEY and SHOPIFY_API_SECRET must be set");
    }

    try {
      const response = await axios.post<{
        access_token: string;
        expires_in?: number;
        refresh_token?: string;
        refresh_token_expires_in?: number;
      }>(`https://${shop}/admin/oauth/access_token`, {
        client_id: apiKey,
        client_secret: apiSecret,
        grant_type: "refresh_token",
        refresh_token: session.refreshToken,
      });

      const {
        access_token,
        expires_in,
        refresh_token,
        refresh_token_expires_in,
      } = response.data;

      const newExpiresAt = expires_in
        ? new Date(Date.now() + expires_in * 1000)
        : null;
      const newRefreshTokenExpiresAt = refresh_token_expires_in
        ? new Date(Date.now() + refresh_token_expires_in * 1000)
        : null;

      await db.session.update({
        where: { id: session.id },
        data: {
          accessToken: access_token,
          expires: newExpiresAt,
          refreshToken: refresh_token || session.refreshToken,
          refreshTokenExpires:
            newRefreshTokenExpiresAt || session.refreshTokenExpires,
        },
      });

      return {
        accessToken: access_token,
        expiresAt: newExpiresAt,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to refresh token";
      throw new Error(`Token refresh failed: ${errorMessage}`);
    }
  };

  refreshAccessToken = async ({ shop }: { shop: string }): Promise<string> => {
    const result = await this.refreshAccessTokenByShop({ shop });
    return result.accessToken;
  };
}

const shopifyTokenService = new ShopifyTokenService();

export default shopifyTokenService;
