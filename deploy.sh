#!/bin/bash
# Alrahim 生产环境部署脚本
set -e

NGINX_CONF="/usr/local/nginx/conf/nginx.conf"
PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "===== Alrahim 生产环境部署 ====="
cd "$PROJECT_DIR"

# ========== 环境检查 ==========

# Node.js 版本
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
  echo "错误: 需要 Node.js >= 20，当前版本: $(node -v)"
  exit 1
fi

# pnpm
if ! command -v pnpm &> /dev/null; then
  echo "错误: 未安装 pnpm，请运行: npm install -g pnpm@9"
  exit 1
fi

# .env.prod 文件
for f in ".env.prod" "apps/api/.env.prod" "apps/client/.env.prod"; do
  if [ ! -f "$f" ]; then
    echo "错误: 未找到 $f，请先创建环境配置文件（参考 README.md）"
    exit 1
  fi
done

# /etc/hosts 回环解析（解决 JWKS 超时问题）
if ! grep -q "cet-auth.vralph.top" /etc/hosts; then
  echo "添加 /etc/hosts 本地解析..."
  echo "127.0.0.1 cet-auth.vralph.top" >> /etc/hosts
  echo "127.0.0.1 cet-admin.vralph.top" >> /etc/hosts
fi

# Docker 基础服务
echo "检查 Docker 基础服务..."
if ! docker ps | grep -q "redis"; then
  echo "Docker 基础服务未运行，正在启动..."
  docker compose -f docker-compose.prod.yml --env-file .env.prod up -d
  echo "等待服务就绪..."
  sleep 10
fi

# ========== 构建 ==========

echo "[1/5] 安装依赖..."
pnpm install --frozen-lockfile

echo "[2/5] 构建 schema..."
pnpm schema:build

echo "[3/5] 初始化数据库..."
pnpm db:init || echo "数据库已存在，跳过"

echo "[4/5] 构建后端..."
pnpm build:server

echo "[5/5] 构建前端..."
pnpm build:client

# ========== 部署 ==========

# Nginx
if [ -f "$NGINX_CONF" ]; then
  echo "更新 Nginx 配置..."
  cp "$PROJECT_DIR/nginx.conf" "$NGINX_CONF"
  /usr/local/nginx/sbin/nginx -t && /usr/local/nginx/sbin/nginx -s reload
  echo "Nginx 配置已更新"
fi

# PM2 - 正确启动（避免 PM2 嵌套）
echo "启动 API 服务..."
cd "$PROJECT_DIR/apps/api"
if pm2 describe alrahim_api > /dev/null 2>&1; then
  pm2 restart alrahim_api
else
  pm2 start ecosystem.config.js
fi
pm2 save
cd "$PROJECT_DIR"

echo ""
echo "===== 部署完成 ====="
echo ""
echo "  前端: https://cet.vralph.top"
echo "  API:  https://cet-api.vralph.top"
echo "  认证: https://cet-auth.vralph.top"
echo "  管理: https://cet-admin.vralph.top"
echo ""
echo "  查看状态: pm2 list"
echo "  查看日志: pm2 logs alrahim_api"
