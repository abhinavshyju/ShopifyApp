export const successResponse = <T>(data: T, message?: string) => {
  return Response.json(
    {
      success: true,
      data,
      ...(message && { message }),
    },
    { status: 200 },
  );
};

export const errorResponse = (message: string, statusCode = 500) => {
  return Response.json(
    {
      success: false,
      error: {
        message,
        statusCode,
      },
    },
    { status: statusCode },
  );
};
