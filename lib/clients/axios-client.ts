import axios from "axios";

export const magicalCXClient = axios.create({
  baseURL: `${process.env.API_URL || "http://localhost:3000"}/api`,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

magicalCXClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      return Promise.reject({
        message: error.response.data?.message || error.message,
        status: error.response.status,
        data: error.response.data,
      });
    }
    return Promise.reject({
      message: error.message || "An unexpected error occurred",
      status: 500,
    });
  },
);
