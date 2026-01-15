import type { MagicalCXConnectPayload } from "../types/magicalcx";
import db from "../../app/db.server";
import { magicalCXClient } from "lib/clients/axios-client";

class ConnectionService {
  connectToMagicalCX = async (payload: MagicalCXConnectPayload) => {
    const response = await magicalCXClient.post("/shopify-webhook", payload);
    return response.data as {
      success: boolean;
      data: {
        status: string;
        wid: string;
        workspaceName: string;
      };
      message: string;
      error?: {
        message: string;
        status: number;
      };
    };
  };

  disconnectFromMagicalCX = async ({
    shop,
    wid,
  }: {
    shop: string;
    wid: string;
  }) => {
    const response = await magicalCXClient.put(`/shopify-webhook`, {
      shop,
      wid,
    });
    return response.data;
  };

  getConnectionInfo = async ({ shop }: { shop: string }) => {
    const connection = await db.magicalCXConnection.findFirst({
      where: { shop },
    });
    if (!connection) {
      throw new Error("Connection not found");
    }
    return connection;
  };
}

const connectionService = new ConnectionService();

export default connectionService;
