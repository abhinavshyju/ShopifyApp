export interface ShopifySessionData {
  shop: string;
  accessToken: string;
  scope?: string | null;
  userId?: bigint | null;
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  accountOwner?: boolean | null;
  locale?: string | null;
  collaborator?: boolean | null;
  emailVerified?: boolean | null;
}

export interface MagicalCXConnectPayload {
  apiKey: string;
  shop: string;
  accessToken: string;
  accessTokenExpiresAt?: string | null;
}

export interface MagicalCXRefreshTokenRequest {
  shop: string;
}

export interface MagicalCXRefreshTokenResponse {
  accessToken: string;
  accessTokenExpiresAt: string | null;
  shop: string;
}

export interface MagicalCXWorkspaceData {
  status: string;
  workspaceName: string;
  wid: string;
}

export interface MagicalCXConnectionData {
  id: string;
  shop: string;
  workspaceId: string;
  workspaceName: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}
