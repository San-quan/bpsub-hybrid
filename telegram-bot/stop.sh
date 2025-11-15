#!/bin/bash
# Telegram 客服机器人停止脚本

set -e

echo "🛑 正在停止服务..."

if docker compose version &> /dev/null; then
    docker compose down
else
    docker-compose down
fi

echo "✅ 服务已停止"
