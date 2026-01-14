import { useEffect, useState } from "react";
import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { useFetcher, useLoaderData } from "react-router";
import { useAppBridge } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import { boundary } from "@shopify/shopify-app-react-router/server";
import db from "../db.server";
import type { MagicalCXConnectionData } from "../../lib/types/magicalcx";
import {
  Badge,
  BlockStack,
  Button,
  Card,
  Divider,
  InlineStack,
  Layout,
  Page,
  Text,
  TextField,
} from "@shopify/polaris";
import { DuplicateIcon, ExternalIcon } from "@shopify/polaris-icons";

interface LoaderData {
  connection: MagicalCXConnectionData | null;
  shop: string;
}

interface MagicalCXResponse {
  success: boolean;
  message?: string;
  error?: { message: string };
  data?: {
    success: boolean;
    data?: {
      status: string;
      workspaceName: string;
      wid: string;
    };
  };
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);

  const connection = await db.magicalCXConnection.findUnique({
    where: { shop: session.shop },
  });

  return {
    shop: session.shop,
    connection: connection
      ? {
          id: connection.id,
          shop: connection.shop,
          workspaceId: connection.workspaceId,
          workspaceName: connection.workspaceName,
          status: connection.status,
          createdAt: connection.createdAt.toISOString(),
          updatedAt: connection.updatedAt.toISOString(),
        }
      : null,
  };
};

export default function Index() {
  const { connection, shop } = useLoaderData<LoaderData>();
  const connectionFetcher = useFetcher();
  const disconnectFetcher = useFetcher();
  const shopify = useAppBridge();
  const [apiKey, setApiKey] = useState("");
  const [copied, setCopied] = useState(false);
  const [isConnected, setIsConnected] = useState(!!connection);
  const [workspaceName, setWorkspaceName] = useState(
    connection?.workspaceName || "",
  );

  const isConnectingMagicalCX =
    ["loading", "submitting"].includes(connectionFetcher.state) &&
    connectionFetcher.formMethod === "POST";

  const showToast = (message: string, isError = false) => {
    shopify.toast.show(message, { isError });
    console.log(message, isError);
  };

  useEffect(() => {
    if (connectionFetcher.data) {
      const response = connectionFetcher.data as MagicalCXResponse;
      if (response.success && response.data?.success && response.data?.data) {
        shopify.toast.show(
          response.message || "Successfully connected to MagicalCX",
        );
        setIsConnected(true);
        setWorkspaceName(response.data.data.workspaceName);
        setApiKey("");
      } else {
        shopify.toast.show(
          response.error?.message || "Failed to connect to MagicalCX",
          { isError: true },
        );
      }
    }
  }, [connectionFetcher.data, shopify]);

  useEffect(() => {
    if (disconnectFetcher.data) {
      const response = disconnectFetcher.data as MagicalCXResponse;
      if (response.success) {
        shopify.toast.show(
          response.message || "Successfully disconnected from MagicalCX",
        );
        setIsConnected(false);
        setWorkspaceName("");
        setApiKey("");
      } else {
        shopify.toast.show(
          response.error?.message || "Failed to disconnect from MagicalCX",
          { isError: true },
        );
      }
    }
  }, [disconnectFetcher.data, shopify]);

  const handleConnectMagicalCX = (e?: React.FormEvent<HTMLFormElement>) => {
    e?.preventDefault();
    try {
      if (!apiKey.trim()) {
        shopify.toast.show("Please enter an API key", { isError: true });
        return;
      }
      connectionFetcher.submit(
        { apiKey: apiKey.trim() },
        { method: "POST", action: "/api/connect" },
      );
    } catch (error) {
      showToast("Failed to connect", true);
    }
  };

  const handleDisconnect = () => {
    disconnectFetcher.submit(null, {
      method: "DELETE",
      action: "/api/disconnect",
    });
  };

  const handleCopyDomain = async () => {
    const domain = shop;

    try {
      await navigator.clipboard.writeText(domain);

      setCopied(true);
      showToast("Shop domain copied");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      showToast("Failed to copy domain", true);
    }
  };

  const handleRedirectToMagicalCX = () => {
    try {
      window.open("https://magicalcx.com", "_blank", "noopener,noreferrer");
    } catch (error) {
      showToast("Failed to open website", true);
    }
  };

  return (
    <>
      {!isConnected ? (
        <Page>
          <Layout sectioned>
            <Layout.Section variant="fullWidth">
              <div className="min-h-[calc(100vh-200px)] flex items-center justify-center w-full">
                <div className=" w-full">
                  <BlockStack gap="600">
                    <BlockStack gap="200" align="center">
                      <Text variant="headingXl" as="h1" alignment="center">
                        Connect to MagicalCX
                      </Text>

                      <Text tone="subdued" alignment="center" as="p">
                        Sign in with your MagicalCX API key to connect your
                        Shopify store.
                      </Text>
                    </BlockStack>

                    <div className="max-w-xl w-full mx-auto">
                      <Card padding={"600"}>
                        <BlockStack gap="500">
                          <BlockStack gap="500">
                            <BlockStack gap="200">
                              <Text variant="bodySm" tone="subdued" as="p">
                                Your Shopify store domain
                              </Text>

                              <InlineStack
                                align="space-between"
                                gap="200"
                                wrap={false}
                                blockAlign="center"
                              >
                                <Text as="p" fontWeight="semibold">
                                  {shop}
                                </Text>

                                <Button
                                  icon={DuplicateIcon}
                                  variant="secondary"
                                  accessibilityLabel="Copy shop domain"
                                  onClick={() => {
                                    console.log(
                                      "Copy button onClick triggered",
                                    );
                                    handleCopyDomain();
                                  }}
                                >
                                  {copied ? "Copied!" : "Copy"}
                                </Button>
                              </InlineStack>

                              <Text tone="subdued" variant="bodySm" as="p">
                                Copy this and add it inside your MagicalCX
                                dashboard
                              </Text>
                            </BlockStack>

                            <TextField
                              label="MagicalCX API key"
                              placeholder="XXXXX-XXXXX"
                              autoComplete="off"
                              helpText="Generate this key from your MagicalCX account"
                              value={apiKey}
                              onChange={(value) => {
                                console.log("TextField onChange:", value);
                                setApiKey(value);
                              }}
                            />

                            <Button
                              variant="primary"
                              fullWidth
                              size="large"
                              onClick={() => {
                                console.log("Connect button onClick triggered");
                                handleConnectMagicalCX();
                              }}
                              loading={isConnectingMagicalCX}
                              disabled={isConnectingMagicalCX}
                            >
                              Connect MagicalCX
                            </Button>
                          </BlockStack>
                          <Divider />
                          <BlockStack gap="200">
                            <Text tone="subdued" as="p">
                              Don't have a MagicalCX account?
                            </Text>

                            <Button
                              variant="secondary"
                              size="large"
                              icon={ExternalIcon}
                              onClick={() => {
                                console.log(
                                  "Redirect button onClick triggered",
                                );
                                handleRedirectToMagicalCX();
                              }}
                            >
                              Create a MagicalCX account
                            </Button>
                          </BlockStack>
                        </BlockStack>
                      </Card>
                    </div>
                    <div className=" max-w-xl w-full mx-auto">
                      <Card padding={"600"}>
                        <BlockStack gap="200">
                          <Text variant="headingMd" as="h2">
                            Documentation
                          </Text>
                          <p>
                            Lorem ipsum dolor sit amet, consectetur adipisicing
                            elit. Fugit ullam minima nisi dolores ipsum
                            molestiae enim iste? Ut ipsum obcaecati vero cumque
                            ratione qui. Aspernatur unde itaque aliquid cumque
                            quo!
                          </p>
                          <Text as="p">
                            How to connect MagicalCX with Shopify?
                          </Text>
                          <ul>
                            <li>
                              <a
                                className="text-blue-500"
                                href="https://magicalcx.com/docs/shopify"
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                MagicalCX Shopify Documentation
                              </a>
                            </li>
                          </ul>
                        </BlockStack>
                      </Card>
                    </div>
                  </BlockStack>
                </div>
              </div>
            </Layout.Section>
          </Layout>
        </Page>
      ) : (
        <Page>
          <Layout>
            <Layout.Section>
              <Card>
                <BlockStack gap="300">
                  <Text variant="headingMd" as="h2">
                    MagicalCX Connection
                  </Text>
                  <div className="border p-4 rounded-md border-black/20">
                    <InlineStack align="space-between" gap="200">
                      <BlockStack gap="100">
                        <Text variant="bodySm" as="p">
                          Workspace Name
                        </Text>
                        <Text variant="headingMd" as="p">
                          {workspaceName}
                        </Text>
                        <Text variant="bodySm" as="p">
                          Connected on{" "}
                          {connection?.createdAt
                            ? new Date(connection.createdAt).toLocaleDateString(
                                "en-US",
                                {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                  timeZone: "UTC",
                                },
                              )
                            : ""}
                        </Text>
                      </BlockStack>
                      <BlockStack align="space-between" gap="200">
                        <div className="flex justify-end gap-2">
                          <Badge tone="success">Active</Badge>
                        </div>
                        <Button
                          variant="primary"
                          tone="critical"
                          size="slim"
                          // loading={isDisconnecting}
                          // disabled={isDisconnecting}
                          onClick={handleDisconnect}
                        >
                          Disconnect
                        </Button>
                      </BlockStack>
                    </InlineStack>
                  </div>
                </BlockStack>
              </Card>
            </Layout.Section>
            <Layout.Section variant="oneThird"> </Layout.Section>
          </Layout>
        </Page>
      )}
    </>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
