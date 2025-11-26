# Repository directories and placeholders

本文件说明仓库根目录中占位目录的用途（这些目录保留为项目结构占位，已添加 .gitkeep 文件）：

- public/ — 静态公开资源（例如网站静态文件、favicon 等）。
- src/ — 项目主要源代码目录。
- telegram-bot/ — 与 Telegram 机器人相关的脚本/服务（如果有）。
- tests/ — 自动化测试文件。
- workspace/ — 临时工作目录或示例数据（应由 CI/运行时生成，而非提交真实数据）。
- .github/ — GitHub 配置（workflows 等）。

注意：这些目录当前可能为空（仅包含 .gitkeep 占位），实际开发中请将对应代码、资源或 README 补入相应目录。
