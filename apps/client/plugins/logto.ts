import type { LogtoConfig } from "@logto/vue";

import { createLogto, UserScope } from "@logto/vue";
import { defineNuxtPlugin, useRuntimeConfig } from "nuxt/app";

import { setupAuth } from "~/services/auth";

// 已知的「Logto 端点 ↔ SPA App ID」配对,取值须与 apps/client 下各 .env 保持一致。
// 若 Logto 重新初始化(重导 .volumes)导致 App ID 变化,请同步更新此表与对应 .env。
const KNOWN_LOGTO_PAIRS: Record<string, string> = {
  "http://localhost:3010/": "b4vtjjefuw6hh330518kp", // 本地(.env)
  "https://cet-auth.vralph.top/": "ntznbyltojrrn6a9fo3mq", // 生产(.env.prod)
};

// 归一化端点:去首尾空白并统一以斜杠结尾,便于与配对表比对
const normalizeEndpoint = (endpoint: string) => endpoint.trim().replace(/\/?$/, "/");

// 启动保护:确保 endpoint 与 appId 来自同一环境,避免「本地端点 + 生产 AppID」这类静默错配
// (表现为 Logto 报 invalid_client)。发现缺失或跨环境错配即抛错,快速失败。
const assertLogtoEnvConsistent = (endpoint: string, appId: string) => {
  if (!endpoint || !appId) {
    throw new Error(
      `[logto] 配置缺失:endpoint="${endpoint}" appId="${appId}"。请检查 apps/client/.env 的 LOGTO_ENDPOINT / LOGTO_APP_ID。`,
    );
  }

  const normalized = normalizeEndpoint(endpoint);
  const expectedAppId = KNOWN_LOGTO_PAIRS[normalized];
  // 反查该 appId 按配对表本应搭配的端点,用于识别「AppID 属于另一环境」
  const appIdBelongsTo = Object.entries(KNOWN_LOGTO_PAIRS).find(([, id]) => id === appId)?.[0];

  // 端点是已知环境,但 appId 不是该环境对应的那个
  if (expectedAppId && expectedAppId !== appId) {
    throw new Error(
      `[logto] 环境不一致:端点 ${normalized} 对应的 App ID 应为 ${expectedAppId},当前却是 ${appId}` +
        (appIdBelongsTo ? `(该 App ID 属于 ${appIdBelongsTo})` : "") +
        `。请让 LOGTO_ENDPOINT 与 LOGTO_APP_ID 取自同一个 .env。`,
    );
  }

  // appId 是已知环境的,但端点不是它对应的那个(端点未在表中时也能兜住)
  if (appIdBelongsTo && appIdBelongsTo !== normalized) {
    throw new Error(
      `[logto] 环境不一致:App ID ${appId} 属于 ${appIdBelongsTo},当前端点却是 ${normalized}。` +
        `请让 LOGTO_ENDPOINT 与 LOGTO_APP_ID 取自同一个 .env。`,
    );
  }
};

export default defineNuxtPlugin((nuxtApp) => {
  const runtimeConfig = useRuntimeConfig();

  const endpoint = runtimeConfig.public.endpoint;
  const appId = runtimeConfig.public.appId;

  assertLogtoEnvConsistent(endpoint, appId);

  const config: LogtoConfig = {
    endpoint,
    appId,

    scopes: [
      UserScope.Email,
      UserScope.Phone,
      UserScope.CustomData,
      UserScope.Identities,
      UserScope.Organizations,
    ],
    resources: [runtimeConfig.public.backendEndpoint],
  };

  nuxtApp.vueApp.use(createLogto, config);
  setupAuth();
});
