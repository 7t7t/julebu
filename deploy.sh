#!/bin/bash
# Alrahim 生产环境部署脚本
set -e

echo "===== Alrahim 生产环境部署 ====="

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
echo "[1/6] 安装依赖..."
pnpm install --frozen-lockfile

# 2. 构建 schema
echo "[2/6] 构建 schema..."
pnpm schema:build

# 3. 初始化数据库
echo "[3/6] 初始化数据库..."
NODE_ENV=prod pnpm db:init

# 4. 构建后端
echo "[4/6] 构建后端..."
pnpm build:server

# 5. 构建前端（静态生成）
echo "[5/6] 构建前端..."
pnpm build:client

# 6. 启动/重启 API 服务
echo "[6/6] 启动 API 服务..."
cd apps/api
if pm2 describe alrahim_api > /dev/null 2>&1; then
  echo "重启 API 服务..."
  pm2 restart alrahim_api
else
  echo "首次启动 API 服务..."
  NODE_ENV=prod pm2 start ecosystem.config.js
fi
pm2 save
cd ../..

echo ""
echo "===== 部署完成 ====="
echo "前端静态文件: apps/client/.output/public/"
echo "请将前端文件部署到 Nginx 的 root 目录"
echo ""
echo "检查 API 状态: pm2 status"
echo "查看 API 日志: pm2 logs alrahim_api"
