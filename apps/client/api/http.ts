import type { $Fetch } from "ofetch";

import { useRuntimeConfig } from "#app";
import { ofetch } from "ofetch";

import { getToken, refreshToken } from "~/services/auth";

let http: $Fetch;
let isRefreshing = false;

export function setupHttp() {
  if (http) return http;

  const config = useRuntimeConfig();
  const baseURL = config.public.apiBase as string;

  http = ofetch.create({
    baseURL,
    headers: { "Content-Type": "application/json" },
    async onRequest({ options }) {
      const token = await getToken();
      options.headers = { ...options.headers, Authorization: `Bearer ${token}` };
    },
    async onResponseError({ request, response, options }) {
      // 401 时尝试刷新 token 并重试一次
      if (response.status === 401 && !isRefreshing) {
        isRefreshing = true;
        try {
          const newToken = await refreshToken();
          if (newToken) {
            isRefreshing = false;
            // 用新 token 重试原请求
            return ofetch(request as string, {
              ...options,
              baseURL,
              headers: { ...options.headers, Authorization: `Bearer ${newToken}` },
              retry: 0,
            });
          }
        } catch {
          // refresh 失败，走正常错误处理
        }
        isRefreshing = false;
      }

      const { message } = response._data;
      if (Array.isArray(message)) {
        message.forEach((item) => {
          httpStatusErrorHandler?.(item, response.status);
        });
      } else {
        httpStatusErrorHandler?.(message, response.status);
      }
      return Promise.reject(response._data);
    },
    retry: 3,
    retryDelay: 1000,
    retryStatusCodes: [408, 409, 425, 429, 500, 502, 503, 504],
  });
}

type HttpStatusErrorHandler = (message: string, statusCode: number) => void;
let httpStatusErrorHandler: HttpStatusErrorHandler;

export function injectHttpStatusErrorHandler(handler: HttpStatusErrorHandler) {
  httpStatusErrorHandler = handler;
}

export function getHttp() {
  if (!http) {
    throw new Error("HTTP client not initialized. Call setupHttp first.");
  }
  return http;
}
