#!/bin/bash
# Alrahim 生产环境部署脚本
set -e

NGINX_CONF="/usr/local/nginx/conf/nginx.conf"
PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "===== Alrahim 生产环境部署 ====="

# 设置生产环境变量（所有后续命令生效）
export NODE_ENV=prod

# 检查 Node 版本
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
  echo "错误: 需要 Node.js >= 20，当前版本: $(node -v)"
  exit 1
fi

# 检查 pnpm
if ! command -v pnpm &> /dev/null; then
  echo "错误: 未安装 pnpm，请运行: npm install -g pnpm@9"
  exit 1
fi

# 1. 安装依赖
echo "[1/7] 安装依赖..."
pnpm install --frozen-lockfile

# 2. 构建 schema
echo "[2/7] 构建 schema..."
pnpm schema:build

# 3. 初始化数据库
echo "[3/7] 初始化数据库..."
pnpm db:init

# 4. 构建后端
echo "[4/7] 构建后端..."
pnpm build:server

# 5. 构建前端（静态生成）
echo "[5/7] 构建前端..."
pnpm build:client

# 6. 更新 Nginx 配置
echo "[6/7] 更新 Nginx 配置..."
cp "$PROJECT_DIR/nginx.conf" "$NGINX_CONF"
/usr/local/nginx/sbin/nginx -t
/usr/local/nginx/sbin/nginx -s reload
echo "Nginx 配置已更新并重载"

# 7. 启动/重启 API 服务
echo "[7/7] 启动 API 服务..."
cd apps/api
if pm2 describe alrahim_api > /dev/null 2>&1; then
  echo "重启 API 服务..."
  pm2 restart alrahim_api
else
  echo "首次启动 API 服务..."
  pm2 start ecosystem.config.js
fi
pm2 save
cd ../..

echo ""
echo "===== 部署完成 ====="
echo "前端站点: https://cet.vralph.top"
echo "API 服务: https://cet-api.vralph.top"
echo "认证服务: https://cet-auth.vralph.top"
echo ""
echo "检查 API 状态: pm2 status"
echo "查看 API 日志: pm2 logs alrahim_api"
