# Telegram 客服机器人

基于 [bostrot/telegram-support-bot](https://github.com/bostrot/telegram-support-bot) 的 Telegram 客服系统。

## ✨ 功能特点

- 🎫 **工单系统** - 自动创建和管理用户工单
- 👥 **团队协作** - 支持多客服团队协作
- 📊 **分类管理** - 按类别分配工单到不同群组
- 🤖 **自动回复** - 支持关键词自动回复和 AI 助手
- 🔔 **实时通知** - 客服组实时接收用户消息
- 🚫 **防骚扰** - 防刷屏、封禁功能
- 💾 **MongoDB** - 数据持久化存储
- 🌐 **多平台** - 支持 Telegram、Signal、Web

## 📦 快速开始

### 1. 准备工作

#### 创建 Telegram Bot
1. 与 [@BotFather](https://t.me/BotFather) 对话
2. 发送 `/newbot` 创建新机器人
3. 按提示设置机器人名称和用户名
4. 获取 Bot Token（类似 `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`）

#### 获取必要的 ID
1. 获取你的用户 ID：
   - 与 [@userinfobot](https://t.me/userinfobot) 对话即可获取
2. 获取客服群组 ID：
   - 创建一个群组
   - 将机器人添加到群组
   - 将机器人设置为管理员
   - 启动机器人后在群里发送 `/id` 获取群组 ID

### 2. 配置

复制配置文件并编辑：

```bash
cd telegram-bot
cp config/config-sample.yaml config/config.yaml
nano config/config.yaml
```

**必须修改的配置项：**

```yaml
bot_token: '你的机器人Token'        # 从 @BotFather 获取
owner_id: '你的Telegram用户ID'     # 你的用户 ID
staffchat_id: '客服群组ID'         # 客服群组的 ID（负数）
```

### 3. 启动

```bash
# 使用 Docker Compose 启动
docker-compose up -d

# 查看日志
docker-compose logs -f bot
```

### 4. 测试

1. 在 Telegram 中找到你的机器人
2. 发送 `/start` 开始对话
3. 发送一条消息，检查客服群组是否收到
4. 在群组中回复消息，检查用户是否收到

## 📜 使用说明

### 用户命令

- `/start` - 开始使用机器人
- `/help` - 查看帮助信息
- `/faq` - 查看常见问题
- `/id` - 查看自己的 ID

### 客服命令（仅客服组可用）

- `/open` - 查看所有未处理的工单
- `/close` - 关闭当前回复的工单
- `/reopen` - 重新打开工单
- `/ban` - 封禁用户
- `/unban` - 解封用户
- `/clear` - 关闭所有工单
- `/help` - 查看客服帮助
- `/id` - 查看群组 ID

### 工作流程

1. **用户发送消息** → 自动创建工单 → 转发到客服群组
2. **客服回复消息** → 自动发送给用户
3. **客服使用 /close** → 关闭工单

## 🔧 高级配置

### 自动回复

在 `config.yaml` 中配置关键词自动回复：

```yaml
autoreply:
  - question: '你好|hi|hello'
    answer: '您好！欢迎咨询，请问有什么可以帮助您的？'
  - question: '价格|费用'
    answer: '关于价格问题，请稍候，我们的客服会尽快为您解答。'
```

### 工单分类

配置多个客服组处理不同类型的问题：

```yaml
categories:
  - name: '技术支持'
    msg: '请描述您遇到的技术问题'
    tag: 'TECH'
    group_id: '-1001234567890'  # 技术支持群组 ID
    subgroups: []
    
  - name: '商务咨询'
    msg: '请说明您的商务需求'
    tag: 'BUSINESS'
    group_id: '-1001234567891'  # 商务群组 ID
    subgroups: []
```

### AI 助手（可选）

启用 OpenAI 自动回复：

```yaml
use_llm: true
llm_api_key: 'sk-...'  # OpenAI API Key
llm_base_url: 'https://api.openai.com/v1'
llm_model: 'gpt-3.5-turbo'
llm_knowledge: |
  Q: 公司主要业务是什么？
  A: 我们提供 XXX 服务
  
  Q: 如何购买？
  A: 您可以通过 XXX 方式购买
```

## 🗄️ 数据管理

### 备份数据

```bash
# 导出 MongoDB 数据
docker exec support-bot-mongodb mongodump --out /data/db/backup

# 复制备份到本地
docker cp support-bot-mongodb:/data/db/backup ./mongodb-backup
```

### 恢复数据

```bash
# 复制备份到容器
docker cp ./mongodb-backup support-bot-mongodb:/data/db/restore

# 恢复数据
docker exec support-bot-mongodb mongorestore /data/db/restore
```

### 查看数据库

```bash
# 连接到 MongoDB
docker exec -it support-bot-mongodb mongosh

# 使用数据库
use support

# 查看集合
show collections

# 查看工单
db.getCollectionNames().forEach(c => db[c].find().pretty())
```

## 🔍 故障排查

### 机器人无响应

```bash
# 检查日志
docker-compose logs -f bot

# 检查 MongoDB 连接
docker-compose logs mongodb

# 重启服务
docker-compose restart bot
```

### 常见问题

**Q: 机器人不回复消息？**
- 检查 bot_token 是否正确
- 确认机器人已启用（BotFather 中检查）
- 查看日志是否有错误

**Q: 客服组收不到消息？**
- 确认 staffchat_id 正确（必须是负数）
- 确认机器人在群组中
- 确认机器人是群组管理员

**Q: 回复用户失败？**
- 确认用户先发送了消息
- 检查是否使用回复功能
- 查看日志中的错误信息

**Q: 数据库连接失败？**
- 检查 MongoDB 是否启动
- 检查 mongodb_uri 配置
- 确认网络连接正常

## 📊 监控

### 查看运行状态

```bash
# 查看容器状态
docker-compose ps

# 查看资源使用
docker stats

# 查看实时日志
docker-compose logs -f
```

### 性能优化

- MongoDB 定期清理旧数据
- 调整 spam_time 和 spam_cant_msg 防止滥用
- 启用 auto_close_tickets 自动关闭旧工单

## 🔗 相关链接

- [官方项目](https://github.com/bostrot/telegram-support-bot)
- [官方 Wiki](https://github.com/bostrot/telegram-support-bot/wiki)
- [Telegram Bot API](https://core.telegram.org/bots/api)
- [托管服务 Botspace](https://botspace.bostrot.com)

## 📝 更新日志

### 当前版本
- 基于 bostrot/telegram-support-bot:latest
- 完整的中文配置
- Docker Compose 一键部署
- MongoDB 数据持久化

## 📄 许可证

基于原项目 GPL-3.0 许可证

---

**需要帮助？** 查看官方文档或在 Issues 中提问
