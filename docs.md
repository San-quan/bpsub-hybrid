PR 简短描述（Body）
- 将仓库中以数字开头的设计/代码片段迁移到 `src/`（`src/subscription/`, `src/auth/`），并新增项目文档与 Copilot 使用说明（`ARCHITECTURE_OUTLINE.md`、`PROJECT_STRUCTURE.md`、`.github/copilot-instructions.md`）。
- 新增 `wrangler.sample.toml` 作为示例配置（已移除/替换敏感值）。
- 目的：提升可维护性并为 AI 代理与开发者提供快速上手文档。

快速 Checklist（可选）
- [ ] 已将敏感值移至 Cloudflare secrets（`wrangler secret put`）
- [ ] 本地 `wrangler dev` 或 `telegram-bot` 启动通过基本验证
- [ ] Reviewer 检查文档与文件移动是否符合项目约定
