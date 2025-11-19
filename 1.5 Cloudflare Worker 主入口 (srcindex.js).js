import { TokenAuth } from './auth/token-auth.js';
import { SubscriptionConverter } from './subscription/converter.js';
import { NodeManager } from './subscription/node-manager.js';
import { TelegramNotifier } from './notification/telegram-bot.js';

export default {
  async fetch(request, env) {
    const auth = new TokenAuth(env);
    const converter = new SubscriptionConverter(env);
    const nodeManager = new NodeManager(env);
    const notifier = new TelegramNotifier(env);

    try {
      // 1. Token验证
      const url = new URL(request.url);
      const token = url.searchParams.get('token');
      const authResult = auth.validateToken(token);
      
      if (!authResult.valid) {
        return auth.handleUnauthorized(request);
      }

      // 2. 速率限制检查
      const clientIP = request.headers.get('cf-connecting-ip');
      if (!await this.checkRateLimit(clientIP, authResult)) {
        return new Response('Rate limit exceeded', { status: 429 });
      }

      // 3. 获取并处理订阅
      const targetFormat = url.searchParams.get('format') || 'clash';
      const subscriptionUrl = env.SUBSCRIPTION_URL;
      
      let nodes = await converter.getNodes(subscriptionUrl);
      nodes = await nodeManager.healthCheck(nodes);
      nodes = await nodeManager.manageChinaNodes(nodes);
      
      const config = await converter.convert(nodes, targetFormat, {
        config: env.SUB_CONFIG,
        emoji: true
      });

      // 4. 记录访问日志
      await notifier.logAccess({
        ip: clientIP,
        tokenType: authResult.type,
        format: targetFormat,
        timestamp: new Date().toISOString()
      });

      // 5. 返回结果
      return new Response(config, {
        headers: {
          'Content-Type': this.getContentType(targetFormat),
          'Subscription-User-Agent': `CF-Sub-System/1.0`,
          'Cache-Control': 'public, max-age=300'
        }
      });

    } catch (error) {
      // 错误处理和通知
      await notifier.sendAlert(`System Error: ${error.message}`);
      return new Response('Internal Server Error', { status: 500 });
    }
  }
}