# Worker / CI Quickstart

已添加文件：
- configs/cloudflare_worker.js
- wrangler.sample.toml
- .github/workflows/wrangler-dry-run.yml

必要 Secrets（Settings  Secrets  Actions）:
- CF_API_TOKEN
- BACKEND_ORIGIN (例如 http://47.243.27.69:25500)
- BACKEND_AUTH（可选）

本地测试示例：
wrangler dev --local --config wrangler.sample.toml
curl -v http://47.243.27.69:25500/version
