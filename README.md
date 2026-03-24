<div align="center">
  <img alt="Alrahim" width="120" height="120" src="./assets/logo/logo.png">
  <h1>Alrahim</h1>
  <p>通过连词构句的方式让你更好的学习英语~ 😊</p>
</div>

## 项目架构

```
alrahim/
├── apps/
│   ├── api/          # NestJS 后端（PM2 管理）
│   └── client/       # Nuxt 前端（静态生成，Nginx 托管）
├── packages/         # 共享包（schema、db 等）
├── docker-compose.prod.yml   # 生产基础设施（PostgreSQL + Redis + Logto）
├── nginx.conf                # Nginx 反向代理配置
├── deploy.sh                 # 一键部署脚本
└── .env.prod                 # Docker Compose 环境变量
```

### 服务架构

| 域名                   | 服务              | 端口 | 运行方式       |
| ---------------------- | ----------------- | ---- | -------------- |
| `cet.vralph.top`       | Nuxt 前端（静态） | —    | Nginx 直接托管 |
| `cet-api.vralph.top`   | NestJS 后端 API   | 3001 | PM2            |
| `cet-auth.vralph.top`  | Logto 认证服务    | 3010 | Docker         |
| `cet-admin.vralph.top` | Logto 管理后台    | 3011 | Docker         |

---

## 本地开发

### 环境要求

- Node.js >= 20
- pnpm >= 8（`corepack enable`）
- Docker

### 快速开始

```bash
# 1. 安装依赖
pnpm install

# 2. 配置环境变量
cp apps/api/.env.example apps/api/.env
cp apps/client/.env.example apps/client/.env

# 3. 恢复 Logto 数据（首次）
unzip logto_db_init_data.zip -d .volumes/

# 4. 启动 Docker 服务（PostgreSQL + Redis + Logto）
pnpm docker:start

# 5. 初始化数据库（首次）
pnpm db:init

# 6. 上传课程数据（首次）
pnpm db:upload

# 7. 启动后端
pnpm dev:serve

# 8. 启动前端（新终端）
pnpm dev:client
```

Logto 管理后台：http://localhost:3011（admin / WkN7g5-i8ZrJckX）

---

## 生产部署

### 前置条件

- Linux 服务器（CentOS/Ubuntu），已安装 Node.js 20+、pnpm 9+、Docker、Nginx
- 域名已解析并配置 SSL 证书（`cet.vralph.top`、`cet-api.vralph.top`、`cet-auth.vralph.top`、`cet-admin.vralph.top`）

### 第一步：克隆项目并安装依赖

```bash
cd /data
git clone <repo-url> julebu
cd julebu
pnpm install --frozen-lockfile
```

### 第二步：配置环境变量

需要配置 3 个 `.env.prod` 文件：

**1) 根目录 `.env.prod`**（Docker Compose 用）：

```bash
cat > .env.prod << 'EOF'
DB_PASSWORD=你的数据库密码
LOGTO_DB_PASSWORD=你的Logto数据库密码
LOGTO_ENDPOINT=https://cet-auth.vralph.top
LOGTO_ADMIN_ENDPOINT=https://cet-admin.vralph.top
EOF
```

**2) `apps/api/.env.prod`**（后端用）：

```bash
cat > apps/api/.env.prod << 'EOF'
DATABASE_URL="postgres://alrahim:你的数据库密码@127.0.0.1:5432/alrahim"
SECRET="$(openssl rand -hex 32)"
REDIS_URL="redis://127.0.0.1:6389"
REDIS_PASSWORD=""
LOGTO_CLIENT_ID="稍后从Logto获取"
LOGTO_CLIENT_SECRET="稍后从Logto获取"
LOGTO_M2M_API="https://default.logto.app/api"
LOGTO_ENDPOINT="https://cet-auth.vralph.top/"
BACKEND_ENDPOINT="https://cet-api.vralph.top/"
PORT=3001
EOF
```

**3) `apps/client/.env.prod`**（前端用）：

```bash
cat > apps/client/.env.prod << 'EOF'
API_BASE="https://cet-api.vralph.top"
LOGTO_APP_ID="稍后从Logto获取"
LOGTO_ENDPOINT="https://cet-auth.vralph.top/"
BACKEND_ENDPOINT="https://cet-api.vralph.top/"
LOGTO_SIGN_IN_REDIRECT_URI="https://cet.vralph.top/callback"
LOGTO_SIGN_OUT_REDIRECT_URI="https://cet.vralph.top/"
HELP_DOCS_URL=""
CLARITY=""
EOF
```

### 第三步：配置 hosts（解决服务器回环访问问题）

API 服务需要通过域名访问本机的 Logto JWKS 端点来验证 Token。必须在 `/etc/hosts` 中添加本地解析，否则会因 DNS 回环导致 JWKS 请求超时（`ERR_JWKS_TIMEOUT`），Token 验证失败返回 401：

```bash
echo "127.0.0.1 cet-auth.vralph.top" >> /etc/hosts
echo "127.0.0.1 cet-admin.vralph.top" >> /etc/hosts
```

### 第四步：启动 Docker 基础服务

```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d
```

验证所有容器正常：

```bash
docker ps --format "table {{.Names}}\t{{.Status}}"
# 确保 db、redis、logto、logtoPostgres 都是 Up (healthy)
```

### 第五步：配置 Logto

通过 SSH 端口转发访问 Logto 管理后台：

```bash
# 本地电脑执行
ssh -L 3011:127.0.0.1:3011 user@服务器IP
# 然后浏览器打开 http://localhost:3011
```

或者如果 Nginx 已配置，直接访问 `https://cet-admin.vralph.top`。

#### 5.1 创建 API Resource

**API Resources** → **Create API Resource**：

- Name: `CET API`
- Identifier: `https://cet-api.vralph.top/`

#### 5.2 创建前端应用（SPA）

**Applications** → **Create** → **Single Page Application**：

- Redirect URI: `https://cet.vralph.top/callback`
- Post Sign-out Redirect URI: `https://cet.vralph.top/`
- 将 **App ID** 填入 `apps/client/.env.prod` 的 `LOGTO_APP_ID`

#### 5.3 创建后端应用（M2M）

**Applications** → **Create** → **Machine-to-Machine**：

- 将 **App ID** 填入 `apps/api/.env.prod` 的 `LOGTO_CLIENT_ID`
- 将 **App Secret** 填入 `apps/api/.env.prod` 的 `LOGTO_CLIENT_SECRET`
- 进入该应用的 **Roles** 标签 → **Assign roles** → 分配包含 Logto Management API `all` 权限的角色

### 第六步：构建并启动

```bash
bash deploy.sh
```

或手动执行：

```bash
# 构建
pnpm schema:build
pnpm build:server
pnpm build:client

# 初始化数据库（首次部署）
pnpm db:init

# 配置 Nginx
cp nginx.conf /usr/local/nginx/conf/nginx.conf
/usr/local/nginx/sbin/nginx -t && /usr/local/nginx/sbin/nginx -s reload

# 启动 API（PM2）
cd apps/api
pm2 start ecosystem.config.js
pm2 save
pm2 startup   # 设置开机自启
```

### 第七步：验证

```bash
# API 正常（返回 Unauthorized 即代表服务在运行）
curl https://cet-api.vralph.top/user
# → {"data":{},"message":"Unauthorized"}

# 前端正常
curl -s -o /dev/null -w "%{http_code}" https://cet.vralph.top/
# → 200

# Logto 正常
curl https://cet-auth.vralph.top/oidc/.well-known/openid-configuration | head -c 50
# → {"authorization_endpoint":"https://cet-auth...

# PM2 状态
pm2 list
```

---

## 日常运维

```bash
# 查看 API 日志
pm2 logs alrahim_api

# 重启 API
pm2 restart alrahim_api

# 重启 Docker 基础服务
docker compose -f docker-compose.prod.yml --env-file .env.prod restart

# 更新代码后重新部署
git pull
bash deploy.sh

# 停止所有服务
pm2 stop alrahim_api
docker compose -f docker-compose.prod.yml stop
```

---

## 常见问题

### 401 Unauthorized（Token 验证失败）

**原因 1：JWKS 超时** — API 无法从服务器内部访问 `https://cet-auth.vralph.top/oidc/jwks`

```bash
# 确认 /etc/hosts 已配置
grep cet-auth /etc/hosts
# 如果没有：
echo "127.0.0.1 cet-auth.vralph.top" >> /etc/hosts
pm2 restart alrahim_api
```

**原因 2：环境变量未加载**

```bash
pm2 env 0 | grep LOGTO_ENDPOINT
# 如果为空，重建进程：
pm2 delete alrahim_api
cd /data/julebu/apps/api && pm2 start ecosystem.config.js
```

### `invalid_client` 错误

检查 `apps/api/.env.prod` 的 `LOGTO_CLIENT_ID` / `LOGTO_CLIENT_SECRET` 与 Logto 管理后台的 M2M 应用一致，并确保 M2M 应用已分配 Management API 权限。

### `invalid_target`（resource indicator is missing）

在 Logto 管理后台 → **API Resources** 创建 Identifier 为 `https://cet-api.vralph.top/` 的资源。

### 502 Bad Gateway

```bash
# 检查上游服务是否运行
docker ps          # Logto/PostgreSQL/Redis
pm2 list           # API
pm2 logs alrahim_api --lines 50  # 查看具体错误
```

### 端口被占用（EADDRINUSE）

```bash
# 找到占用端口的进程
lsof -i:3001
# 停掉 PM2 管理的进程
pm2 stop alrahim_api
# 或直接杀死
kill $(lsof -t -i:3001)
```

### 数据库连接失败

确认 Docker 中 PostgreSQL 正常运行，且 `apps/api/.env.prod` 的 `DATABASE_URL` 密码与 `.env.prod` 的 `DB_PASSWORD` 一致。

```bash
docker ps | grep db
docker logs julebu-db-1
```

---

## 测试

### 前端测试

```bash
cd apps/client
pnpm test:unit:run    # Vitest 单测
pnpm test:e2e:run     # Cypress E2E
```

### 后端测试

```bash
cd apps/api
cp .env.test.example .env.test  # 首次需要
pnpm test                       # 单测 + E2E
```

admin
dmUT76yQ
