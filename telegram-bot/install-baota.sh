#!/bin/bash
# Telegram Bot 宝塔服务器一键部署脚本
# 适用于宝塔 Linux 面板

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}"
cat << "EOF"
╔══════════════════════════════════════════════════════════════╗
║     Telegram AI 客服机器人 - 宝塔一键部署脚本               ║
║     适用于宝塔 Linux 面板                                    ║
╚══════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

# 检查是否为 root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}✗ 请使用 root 权限运行此脚本${NC}"
    echo "使用命令: sudo bash install-baota.sh"
    exit 1
fi

echo -e "${GREEN}✓${NC} Root 权限检查通过"
echo ""

# 步骤 1: 检查宝塔是否安装
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}步骤 1/6: 检查宝塔环境${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

if [ -d "/www/server/panel" ]; then
    echo -e "${GREEN}✓${NC} 宝塔面板已安装"
    BT_VERSION=$(cat /www/server/panel/class/common.py | grep "version = " | awk -F "'" '{print $2}' | head -1)
    echo "  版本: $BT_VERSION"
else
    echo -e "${YELLOW}⚠${NC} 未检测到宝塔面板"
    echo "如需安装宝塔，请访问: https://www.bt.cn/new/download.html"
    read -p "继续安装? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo ""

# 步骤 2: 安装 Docker
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}步骤 2/6: 安装 Docker${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

if command -v docker &> /dev/null; then
    DOCKER_VERSION=$(docker --version | awk '{print $3}' | sed 's/,//')
    echo -e "${GREEN}✓${NC} Docker 已安装 (版本: $DOCKER_VERSION)"
else
    echo "正在安装 Docker..."
    # 使用阿里云镜像加速
    curl -fsSL https://get.docker.com | bash -s docker --mirror Aliyun
    
    # 启动 Docker 服务
    systemctl start docker
    systemctl enable docker
    
    # 配置 Docker 镜像加速（阿里云）
    mkdir -p /etc/docker
    cat > /etc/docker/daemon.json <<EOF
{
  "registry-mirrors": [
    "https://docker.mirrors.ustc.edu.cn",
    "https://hub-mirror.c.163.com",
    "https://mirror.baidubce.com"
  ]
}
EOF
    systemctl daemon-reload
    systemctl restart docker
    
    echo -e "${GREEN}✓${NC} Docker 安装完成"
fi

echo ""

# 步骤 3: 安装 Docker Compose
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}步骤 3/6: 安装 Docker Compose${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

if docker compose version &> /dev/null; then
    COMPOSE_VERSION=$(docker compose version | awk '{print $4}')
    echo -e "${GREEN}✓${NC} Docker Compose 已安装 (版本: $COMPOSE_VERSION)"
elif command -v docker-compose &> /dev/null; then
    COMPOSE_VERSION=$(docker-compose --version | awk '{print $3}' | sed 's/,//')
    echo -e "${GREEN}✓${NC} Docker Compose 已安装 (版本: $COMPOSE_VERSION)"
else
    echo "正在安装 Docker Compose..."
    # 使用 GitHub 代理加速下载
    COMPOSE_VERSION="v2.23.0"
    curl -L "https://ghproxy.com/https://github.com/docker/compose/releases/download/${COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    ln -sf /usr/local/bin/docker-compose /usr/bin/docker-compose
    echo -e "${GREEN}✓${NC} Docker Compose 安装完成"
fi

echo ""

# 步骤 4: 创建部署目录
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}步骤 4/6: 创建部署目录${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# 在宝塔网站目录下创建
INSTALL_DIR="/www/wwwroot/telegram-bot"

if [ -d "$INSTALL_DIR" ]; then
    echo -e "${YELLOW}⚠${NC} 目录已存在: $INSTALL_DIR"
    read -p "是否删除旧数据重新安装? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "正在备份旧数据..."
        BACKUP_DIR="/www/backup/telegram-bot-$(date +%Y%m%d-%H%M%S)"
        mkdir -p /www/backup
        mv "$INSTALL_DIR" "$BACKUP_DIR"
        echo -e "${GREEN}✓${NC} 旧数据已备份到: $BACKUP_DIR"
    else
        echo "安装取消"
        exit 0
    fi
fi

mkdir -p "$INSTALL_DIR"
cd "$INSTALL_DIR"
echo -e "${GREEN}✓${NC} 创建目录: $INSTALL_DIR"

echo ""

# 步骤 5: 下载项目文件
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}步骤 5/6: 下载项目文件${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# 检查是否有 git
if ! command -v git &> /dev/null; then
    echo "正在安装 git..."
    if command -v yum &> /dev/null; then
        yum install -y git
    elif command -v apt-get &> /dev/null; then
        apt-get update && apt-get install -y git
    fi
fi

echo "正在从 GitHub 下载项目..."
# 使用 GitHub 代理加速
git clone https://ghproxy.com/https://github.com/San-quan/bpsub-hybrid.git temp
cp -r temp/telegram-bot/* .
rm -rf temp

echo -e "${GREEN}✓${NC} 项目文件下载完成"

echo ""

# 步骤 6: 配置文件
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}步骤 6/6: 配置文件${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# 如果 config.yaml 不存在，从示例复制
if [ ! -f "config/config.yaml" ]; then
    if [ -f "config/config-sample.yaml" ]; then
        cp config/config-sample.yaml config/config.yaml
        echo -e "${GREEN}✓${NC} 配置文件已创建: config/config.yaml"
    fi
fi

echo ""
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}重要: 请配置以下信息${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "配置文件位置: $INSTALL_DIR/config/config.yaml"
echo ""
echo "必须修改的配置项："
echo "  1. bot_token       - 你的 Telegram Bot Token"
echo "  2. owner_id        - 你的 Telegram 用户 ID"
echo "  3. staffchat_id    - 客服群组 ID"
echo ""
echo "可选修改："
echo "  4. llm_api_key     - OpenAI API Key (启用 AI 功能)"
echo ""

read -p "是否现在配置? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "请输入配置信息（留空跳过）："
    echo ""
    
    read -p "Bot Token: " BOT_TOKEN
    read -p "管理员 ID: " OWNER_ID
    read -p "客服群组 ID: " STAFF_ID
    read -p "OpenAI API Key (可选): " OPENAI_KEY
    
    # 修改配置文件
    if [ ! -z "$BOT_TOKEN" ]; then
        sed -i "s/bot_token: 'YOUR_BOT_TOKEN'/bot_token: '$BOT_TOKEN'/" config/config.yaml
        sed -i "s/bot_token: '.*'/bot_token: '$BOT_TOKEN'/" config/config.yaml
        echo -e "${GREEN}✓${NC} Bot Token 已配置"
    fi
    
    if [ ! -z "$OWNER_ID" ]; then
        sed -i "s/owner_id: '.*'/owner_id: '$OWNER_ID'/" config/config.yaml
        echo -e "${GREEN}✓${NC} 管理员 ID 已配置"
    fi
    
    if [ ! -z "$STAFF_ID" ]; then
        sed -i "s/staffchat_id: '.*'/staffchat_id: '$STAFF_ID'/" config/config.yaml
        echo -e "${GREEN}✓${NC} 客服群组 ID 已配置"
    fi
    
    if [ ! -z "$OPENAI_KEY" ]; then
        sed -i "s/llm_api_key: '.*'/llm_api_key: '$OPENAI_KEY'/" config/config.yaml
        sed -i "s/use_llm: false/use_llm: true/" config/config.yaml
        echo -e "${GREEN}✓${NC} OpenAI API Key 已配置"
    fi
fi

echo ""

# 设置权限
chown -R www:www "$INSTALL_DIR"
chmod +x start.sh stop.sh test.sh

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}安装完成！${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "📂 安装目录: $INSTALL_DIR"
echo ""
echo "🚀 启动命令:"
echo "   cd $INSTALL_DIR"
echo "   ./start.sh"
echo ""
echo "📊 查看状态:"
echo "   cd $INSTALL_DIR"
echo "   ./test.sh"
echo ""
echo "📝 查看日志:"
echo "   cd $INSTALL_DIR"
echo "   docker-compose logs -f bot"
echo ""
echo "🛑 停止服务:"
echo "   cd $INSTALL_DIR"
echo "   ./stop.sh"
echo ""
echo "⚙️  配置文件:"
echo "   $INSTALL_DIR/config/config.yaml"
echo ""
echo "📚 文档:"
echo "   START-HERE.md    - 快速开始"
echo "   使用指南.md      - 详细手册"
echo "   测试清单.md      - 测试步骤"
echo ""

# 询问是否立即启动
read -p "是否现在启动服务? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "正在启动服务..."
    cd "$INSTALL_DIR"
    ./start.sh
fi

echo ""
echo -e "${BLUE}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║            感谢使用 Telegram AI 客服机器人！                 ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════════╝${NC}"
