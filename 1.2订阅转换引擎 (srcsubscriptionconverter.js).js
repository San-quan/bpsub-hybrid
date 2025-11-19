export class SubscriptionConverter {
  constructor(env) {
    this.env = env;
    this.supportedFormats = ['clash', 'sing-box', 'surge', 'quantumult', 'loon'];
  }

  async convert(subscription, targetFormat, options = {}) {
    // 调用外部转换服务
    const converterUrl = this.env.SUB_CONVERTER_URL || 'https://subapi.cmliussss.net';
    
    const response = await fetch(`${converterUrl}/sub`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: subscription,
        target: targetFormat,
        config: options.config || this.env.SUB_CONFIG,
        emoji: options.emoji !== false,
        list: options.list || true
      })
    });

    return await response.text();
  }

  // 节点聚合去重
  deduplicateNodes(nodes) {
    const seen = new Set();
    return nodes.filter(node => {
      const key = `${node.server}:${node.port}:${node.type}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  // Base64编码包装
  encodeToBase64(content, format) {
    const prefix = this.getFormatPrefix(format);
    return prefix + btoa(unescape(encodeURIComponent(content)));
  }
}