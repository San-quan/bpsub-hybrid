#!/bin/bash
# Telegram 客服机器人启动脚本

set -e

echo "================================================"
echo "  Telegram 客服机器人 - 启动脚本"
echo "  AI 客服小安 | 优质三方会员服务应用"
echo "================================================"
echo ""

# 检查配置文件
if [ ! -f config/config.yaml ]; then
    echo "❌ 错误: 配置文件不存在"
    echo "请先复制配置文件: cp config/config-sample.yaml config/config.yaml"
    exit 1
fi

# 检查 Docker
if ! command -v docker &> /dev/null; then
    echo "❌ 错误: Docker 未安装"
    echo "请先安装 Docker: https://docs.docker.com/get-docker/"
    exit 1
fi

# 检查 Docker Compose
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "❌ 错误: Docker Compose 未安装"
    exit 1
fi

echo "✅ 配置文件检查通过"
echo "✅ Docker 环境检查通过"
echo ""

# 启动服务
echo "🚀 正在启动服务..."
echo ""

if docker compose version &> /dev/null; then
    docker compose up -d
else
    docker-compose up -d
fi

echo ""
echo "================================================"
echo "  ✅ 服务已启动"
echo "================================================"
echo ""
echo "📊 查看状态: docker-compose ps"
echo "📝 查看日志: docker-compose logs -f bot"
echo "🛑 停止服务: docker-compose down"
echo ""
echo "🤖 测试机器人:"
echo "   1. 在 Telegram 搜索你的机器人"
echo "   2. 发送 /start 开始使用"
echo "   3. 发送任意消息测试 AI 回复"
echo ""
echo "📱 客服组:"
echo "   群组 ID: -10034038523"
echo "   在群组中可使用客服命令"
echo ""
