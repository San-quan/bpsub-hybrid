#!/bin/bash
# 一键测试脚本

set -e

echo "══════════════════════════════════════════════════════════"
echo "  AI 客服小安 - 系统测试"
echo "══════════════════════════════════════════════════════════"
echo ""

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查函数
check_status() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓${NC} $1"
        return 0
    else
        echo -e "${RED}✗${NC} $1"
        return 1
    fi
}

# 1. 检查配置文件
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1️⃣  检查配置文件"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ -f config/config.yaml ]; then
    check_status "配置文件存在"
    
    # 检查关键配置
    if grep -q "bot_token: '8584335653" config/config.yaml; then
        check_status "Bot Token 已配置"
    else
        echo -e "${RED}✗${NC} Bot Token 未配置"
    fi
    
    if grep -q "use_llm: true" config/config.yaml; then
        check_status "AI 已启用"
    else
        echo -e "${YELLOW}⚠${NC} AI 未启用"
    fi
    
    if grep -q "staffchat_id: '-10034038523'" config/config.yaml; then
        check_status "客服群组已配置"
    else
        echo -e "${RED}✗${NC} 客服群组未配置"
    fi
else
    echo -e "${RED}✗${NC} 配置文件不存在"
    echo "请先复制配置文件: cp config/config-sample.yaml config/config.yaml"
    exit 1
fi

echo ""

# 2. 检查 Docker 环境
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "2️⃣  检查 Docker 环境"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

command -v docker &> /dev/null
check_status "Docker 已安装"

if docker compose version &> /dev/null; then
    check_status "Docker Compose 已安装 (新版)"
    COMPOSE_CMD="docker compose"
elif command -v docker-compose &> /dev/null; then
    check_status "Docker Compose 已安装 (旧版)"
    COMPOSE_CMD="docker-compose"
else
    echo -e "${RED}✗${NC} Docker Compose 未安装"
    exit 1
fi

echo ""

# 3. 检查服务状态
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "3️⃣  检查服务状态"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if $COMPOSE_CMD ps | grep -q "telegram-support-bot"; then
    BOT_STATUS=$($COMPOSE_CMD ps telegram-support-bot | grep -o "Up\|Exited" || echo "Unknown")
    if [ "$BOT_STATUS" = "Up" ]; then
        check_status "Bot 容器运行中"
    else
        echo -e "${RED}✗${NC} Bot 容器已停止"
    fi
else
    echo -e "${YELLOW}⚠${NC} Bot 容器未启动"
    echo ""
    read -p "是否现在启动服务? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "正在启动服务..."
        ./start.sh
    else
        echo "请手动启动: ./start.sh"
        exit 0
    fi
fi

if $COMPOSE_CMD ps | grep -q "support-bot-mongodb"; then
    MONGO_STATUS=$($COMPOSE_CMD ps support-bot-mongodb | grep -o "Up\|Exited" || echo "Unknown")
    if [ "$MONGO_STATUS" = "Up" ]; then
        check_status "MongoDB 运行中"
    else
        echo -e "${RED}✗${NC} MongoDB 已停止"
    fi
else
    echo -e "${YELLOW}⚠${NC} MongoDB 未启动"
fi

echo ""

# 4. 检查日志
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "4️⃣  检查最近日志"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo "最近 10 行日志:"
echo "─────────────────────────────────────────────────────"
$COMPOSE_CMD logs --tail=10 bot | tail -10
echo "─────────────────────────────────────────────────────"

# 检查错误
ERROR_COUNT=$($COMPOSE_CMD logs bot | grep -i "error\|failed" | wc -l)
if [ "$ERROR_COUNT" -gt 0 ]; then
    echo -e "${YELLOW}⚠${NC} 发现 $ERROR_COUNT 个错误日志"
    echo "查看详细错误: docker-compose logs bot | grep -i error"
else
    check_status "无错误日志"
fi

echo ""

# 5. 测试提示
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "5️⃣  下一步测试"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo ""
echo "📱 用户端测试:"
echo "   1. 在 Telegram 搜索你的机器人"
echo "   2. 发送 /start"
echo "   3. 发送测试消息"
echo ""
echo "👨‍💼 客服端测试:"
echo "   1. 进入客服群组 (ID: -10034038523)"
echo "   2. 查看是否收到用户消息"
echo "   3. 回复消息测试"
echo ""
echo "📝 详细测试步骤请查看: 测试清单.md"
echo ""

# 6. 总结
echo "══════════════════════════════════════════════════════════"
echo "测试完成！"
echo "══════════════════════════════════════════════════════════"
echo ""
echo "📊 常用命令:"
echo "   ./start.sh                    - 启动服务"
echo "   ./stop.sh                     - 停止服务"
echo "   docker-compose ps             - 查看状态"
echo "   docker-compose logs -f bot    - 查看实时日志"
echo "   docker-compose restart bot    - 重启服务"
echo ""
