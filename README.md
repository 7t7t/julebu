<div align="center">
  <img alt="Alrahim" width="120" height="120" src="./assets/logo/logo.png">
  <h1>Alrahim</h1>
</div>

## ⚡ 介绍

通过连词构句的方式让你更好的学习英语~ 😊

## 🚀 如何开始？

**以下所有相关操作都基于项目根目录位置，请注意检查不要出错！**

### 注意事项

- **pnpm version >= 8**

  ```bash
  corepack enable
  ```

- **Node.js version >= v20**
  > 使用来自 .node-version 的版本 [支持的工具](https://github.com/shadowspawn/node-version-usage#compatibility-testing)
- **Postgres version >= 8.0.0**
- **Redis version >= 5.0.0**
- 项目依赖 **Docker**，所以请确保你本地已安装并成功运行

### 编辑器

#### VSCode

- 安装推荐的插件 [extensions.json](./.vscode/extensions.json)

```bash
docker --version # Docker version 24.0.7, build afdd53b

node --version # v20+

pnpm -v # 8+
```

### 1. 安装依赖

```bash
pnpm install
```

### 2. 配置 `.env` 文件

可以选择将 `./apps/api/.env.example` 文件内容复制到 `./apps/api/.env`，请注意 `example` 文件中的是示例配置，主要是一些系统的环境变量信息，比如：数据库连接地址、用户名、密码、端口、密钥等等，后端服务会从此文件中读取配置信息，**当然你也可以更改成你自己的配置信息**。

Windows 用户推荐快捷键复制粘贴，Linux 用户可以通过下面的命令进行操作。

#### Server

```bash
cp ./apps/api/.env.example ./apps/api/.env
```

#### Client

```bash
cp ./apps/client/.env.example ./apps/client/.env
```

### 3. 恢复 Logto 的数据

解压缩 `logto_db_init_data.zip` 到 `.volumes/`

```bash
unzip logto_db_init_data.zip -d .volumes/
```

- 后台地址: http://localhost:3011
- 用户名: admin
- 密码: WkN7g5-i8ZrJckX

> 如果你想 [手动配置 Logto](https://github.com/cuixueshe/earthworm/wiki/%E8%BF%81%E7%A7%BB-Logto-%E7%94%A8%E6%88%B7%E7%B3%BB%E7%BB%9F%E5%90%8E%E6%9C%AC%E5%9C%B0%E5%90%AF%E5%8A%A8%E9%85%8D%E7%BD%AE%E6%96%B9%E6%A1%88%EF%BC%88%E8%B4%A1%E7%8C%AE%E8%80%85%EF%BC%89)

### 4. 启动 Docker Compose 服务

后端用到了 Postgres 和 Redis 服务，通过下面在 `package.json` 中配置的命令启动和停止。

```bash
# 启动
pnpm docker:start

# 下面这些命令等你用的时候在执行，不要傻乎乎的刚启动就停止哈 😊
# 停止
pnpm docker:stop
# 删除
pnpm docker:delete
# 完全删除（包括 Volume 数据）
pnpm docker:down
```

当然如果你更喜欢手动挡

```bash
docker compose up -d
docker compose stop
docker compose down

# 兼容老版本 docker 的命令
docker-compose up -d
```

### 5. 初始化数据库表结构

执行这个命令时，尽量与上个命令间隔一点时间，因为刚刚使用的 `-d` 参数会让其服务挂起在后台执行，此时 docker 服务可能还在 running 中，若是发现报错了那就再执行一遍。😊

```bash
pnpm db:init
```

### 6. 创建并上传课程数据

**只有第一次初始化数据库后需要执行**。

```bash
pnpm db:upload
```

### 7. 启动后端服务

```bash
pnpm dev:serve
```

### 8. 启动前端服务

```bash
pnpm dev:client
```

## 🛠️ 关于测试

**提交 commit 前先跑测试，测试通过后再提交代码，以免产生多次 commit 来解决测试问题的情况出现**。

### 前端测试

主要就是 Vitest 的单测以及 cypress 的自动化测试，执行以下命令：

```bash
# 进入前端项目目录
cd apps/client

# vitest
pnpm test:unit:run
# cypress
pnpm test:e2e:run

# 监听 vitest，方便热更新看测试结果
pnpm test:unit:watch
```

### 后端测试

主要就是 Jest 的单测和端对端测试，但需要接入测试的数据库，所以需要先确保：

1. Docker Compose 中的 testdb 和 testRedis 服务正常启动。
2. `.env.test` 文件中的配置信息是正确的，如果没有这个文件，可以复制 `apps/api/.env.test.example` 文件内容到 `apps/api/.env.test` 文件，下面有提供命令直接用。

执行以下命令：

```bash
# 进入后端项目目录
cd apps/api

# 如果有 .env.test 文件，就不需要跑这一步了
cp .env.test.example .env.test

# 单测
pnpm test:unit
# 端对端测试
pnpm test:e2e
# 单测和端对端测试一起跑
pnpm test
```

## 文档项目

基于Vitepress文档的项目，执行以下命令：

```bash
# 本地开发
pnpm docs:dev
```

## ❓ 常见问题解答

### 数据库连接不上

我的 Docker 和里面的数据库都正常跑起来了，但是跑 `db:init` 命令时还是报错，提示数据库连接失败。

可以检查下 `.env` 文件中的数据库配置是否正确，甚至是这个文件有没有！😠

### 如何正确的更新课程数据？

当你发现有错误的课程数据并修改后，应当使用下面的命令将课程数据更新到数据库中。

```bash
pnpm db:update
```

### pnpm install 报错？

某些依赖模块需要编译安装，因此需要相关编译环境。如果没有对应环境则会编译失败， 且不同模块所需编译环境不同，因此具体问题需要具体分析。
以下列出已经碰到过的具体问题。

先尝试使用下面的命令更新 `pnpm`。

```shell
pnpm i -g
# or
pnpm i -g pnpm
# or
npx pnpm i -g pnpm@latest
```

**在 Windows 上安装 argon2 模块失败的处理方式**

- 安装 Visual Studio 2015 以上版本的组件，具体来说是 “使用 C++的桌面开发” 这个组件。（实际上包含 C++相关开发工具库的组件都可以）
- 编译过程中遇到中文乱码时，在命令行中执行 `chcp 437` 后，再重新运行 install 命令。

### WSL2 中 docker 无权访问?

在 Windows 中使用 wsl2 做为开发环境时，通过 `docker compose up -d` 启动 docker 出现如下错误：

```bash
permission denied while trying to connect to the Docker daemon socket at unix:///var/run/docker.sock: Get "http://%2Fvar%2Frun%2Fdocker.sock/v1.24/containers/json": dial unix /var/run/docker.sock: connect: permission denied
```

> 解决方法

将当前的用户添加到 docker 组中

```bash
# 添加 docker 用户组
sudo groupadd docker
# 将登录用户加入到 docker 用户组中
sudo gpasswd -a $USER docker
# 更新用户组
newgrp docker
# 测试 docker 命令是否正常使用
docker images
```

### 生产部署

#### 服务架构

| 域名                   | 服务              | 端口 | 运行方式       |
| ---------------------- | ----------------- | ---- | -------------- |
| `cet.vralph.top`       | Nuxt 前端（静态） | —    | Nginx 直接托管 |
| `cet-api.vralph.top`   | NestJS 后端 API   | 3001 | PM2 cluster    |
| `cet-auth.vralph.top`  | Logto 认证服务    | 3010 | Docker         |
| `cet-admin.vralph.top` | Logto 管理后台    | 3011 | Docker         |

服务器路径：`/data/julebu`

---

#### 第一步：配置环境变量

**根目录 `.env.prod`**（Docker Compose 使用）：

```env
DB_PASSWORD=你的数据库密码
LOGTO_DB_PASSWORD=你的Logto数据库密码
LOGTO_ENDPOINT=https://cet-auth.vralph.top
LOGTO_ADMIN_ENDPOINT=https://cet-admin.vralph.top
```

**`apps/api/.env.prod`**（后端使用）：

```env
DATABASE_URL="postgres://alrahim:你的DB_PASSWORD@127.0.0.1:5432/alrahim"
SECRET="随机密钥(openssl rand -hex 32)"
REDIS_URL="redis://127.0.0.1:6389"
REDIS_PASSWORD=""
LOGTO_CLIENT_ID="M2M应用的App ID"
LOGTO_CLIENT_SECRET="M2M应用的App Secret"
LOGTO_M2M_API="https://default.logto.app/api"
LOGTO_ENDPOINT="https://cet-auth.vralph.top/"
BACKEND_ENDPOINT="https://cet-api.vralph.top/"
PORT=3001
```

**`apps/client/.env.prod`**（前端使用）：

```env
API_BASE="https://cet-api.vralph.top"
LOGTO_APP_ID="SPA应用的App ID"
LOGTO_ENDPOINT="https://cet-auth.vralph.top/"
BACKEND_ENDPOINT="https://cet-api.vralph.top/"
LOGTO_SIGN_IN_REDIRECT_URI="https://cet.vralph.top/callback"
LOGTO_SIGN_OUT_REDIRECT_URI="https://cet.vralph.top/"
```

---

#### 第二步：启动 Docker 基础服务

**重要：先修改 `docker-compose.prod.yml`，给 logto 服务添加 `extra_hosts`**，否则容器内 DNS 无法解析外部域名，导致 502/500：

```yaml
logto:
  # ... 其他配置不变
  extra_hosts:
    - "cet-admin.vralph.top:host-gateway"
    - "cet-auth.vralph.top:host-gateway"
```

然后启动：

```bash
cd /data/julebu
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d
```

验证容器状态：

```bash
docker ps -a | grep julebu
# 确保 db、redis、logto、logtoPostgres 都是 Up (healthy)
```

---

#### 第三步：配置 Logto（管理后台）

访问 https://cet-admin.vralph.top/console

##### 3.1 创建 API Resource

进入 **API Resources** → **Create API Resource**：

| API Name | API Identifier                |
| -------- | ----------------------------- |
| CET API  | `https://cet-api.vralph.top/` |

> `https://default.logto.app/api`（Logto Management API）默认已存在，无需创建。

##### 3.2 创建前端应用（SPA）

**Applications** → **Create** → **Single Page Application**：

- Redirect URI: `https://cet.vralph.top/callback`
- Post Sign-out Redirect URI: `https://cet.vralph.top/`
- 记录 **App ID** → 填入 `apps/client/.env.prod` 的 `LOGTO_APP_ID`

##### 3.3 创建后端应用（M2M）

**Applications** → **Create** → **Machine-to-Machine**：

- 记录 **App ID** 和 **App Secret** → 填入 `apps/api/.env.prod`

**关键：给 M2M 应用分配 Management API 权限**

1. 进入 **Roles** 页面，确保有一个 M2M Role 包含 **Logto Management API** 的 `all` 权限（没有就创建）
2. 回到 M2M Application → **Roles** 标签 → **Assign roles** → 分配该 Role

> 不分配权限会导致后端调用 Logto API 时报 `invalid_client`。

---

#### 第四步：构建与部署

使用一键部署脚本：

```bash
cd /data/julebu
bash deploy.sh
```

或手动逐步执行：

```bash
cd /data/julebu

# 1. 安装依赖
pnpm install --frozen-lockfile

# 2. 构建 schema
pnpm schema:build

# 3. 初始化数据库（首次部署必须，导入课程数据）
pnpm db:init

# 4. 构建后端
pnpm build:server

# 5. 构建前端（静态生成）
pnpm build:client

# 6. 更新 Nginx 配置
cp nginx.conf /usr/local/nginx/conf/nginx.conf
/usr/local/nginx/sbin/nginx -t
/usr/local/nginx/sbin/nginx -s reload

# 7. 启动后端 API（PM2 cluster 模式，2 实例）
pnpm prod:serve
```

---

#### 第五步：验证部署

```bash
# Docker 容器状态
docker ps -a | grep julebu

# PM2 进程状态
pm2 list

# 测试 API（应返回 Unauthorized，表示服务正常）
curl -s https://cet-api.vralph.top/user/setup -X POST \
  -H "Content-Type: application/json" -d '{}'
# → {"data":{},"message":"Unauthorized"}

# 测试前端（应返回 200）
curl -s -o /dev/null -w "%{http_code}" https://cet.vralph.top/
# → 200

# 测试 Logto M2M Token（应返回 access_token）
curl -X POST https://cet-auth.vralph.top/oidc/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -H "Authorization: Basic $(echo -n 'CLIENT_ID:CLIENT_SECRET' | base64)" \
  -d "grant_type=client_credentials&resource=https://default.logto.app/api&scope=all"
```

---

#### 常见问题排查

##### 502 Bad Gateway

上游服务未运行：

```bash
# 检查 Docker
docker ps -a | grep logto
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d

# 检查 PM2
pm2 list
pm2 logs alrahim_api --lines 50
```

##### Logto 容器 DNS 解析失败（`getaddrinfo EAI_AGAIN`）

确保 `docker-compose.prod.yml` 中 logto 服务配置了 `extra_hosts`，然后重建容器：

```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d logto
```

##### `invalid_client` 错误

- **前端**：检查 `apps/client/.env.prod` 的 `LOGTO_APP_ID` 与 Logto SPA 应用 ID 一致
- **后端**：检查 `apps/api/.env.prod` 的 `LOGTO_CLIENT_ID` 和 `LOGTO_CLIENT_SECRET`
- **权限不足**：确保 M2M 应用已分配包含 Logto Management API `all` 权限的 Role

##### `resource indicator is missing, or unknown`

在 Logto 管理后台 → API Resources 创建 `https://cet-api.vralph.top/`。

##### 后端 500 `Cannot destructure property 'id'`

数据库无课程数据：

```bash
pnpm schema:build && pnpm db:init
```

##### PM2 环境变量不生效

现在可以设置开机自启：

pm2 save
pm2 startup

`pm2 restart` 不会刷新环境变量，必须先 delete：

```bash
pm2 delete alrahim_api
cd /data/julebu && pnpm prod:serve
```

##### PM2 启动

```
export NODE_ENV=prod
pm2 start "pnpm run prod:serve" --name server
```

---

#### 日常运维

```bash
# 查看 API 日志
pm2 logs alrahim_api

# 重启 API（不刷新环境变量）
pm2 restart alrahim_api

# 重启 API（刷新环境变量）
pm2 delete alrahim_api && cd /data/julebu && pnpm prod:serve

# 重启 Docker 服务
docker compose -f docker-compose.prod.yml --env-file .env.prod restart

# 停止所有服务
pm2 delete all
docker compose -f docker-compose.prod.yml stop
```

admin
dmUT76yQ
