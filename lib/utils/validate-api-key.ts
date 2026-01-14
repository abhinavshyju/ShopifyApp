import { errorResponse } from "./api-response";

export const validateApiKey = (request: Request): Response | null => {
  if (!process.env.MAGICALCX_API_KEY) {
    return null;
  }

  const authHeader = request.headers.get("authorization");
  const apiKey = authHeader?.replace("Bearer ", "");

  if (apiKey !== process.env.MAGICALCX_API_KEY) {
    return Response.json(errorResponse("Unauthorized: Invalid API key", 401), {
      status: 401,
    });
  }

  return null;
};
