export class NodeManager {
  constructor(env) {
    this.env = env;
    this.kv = env.NODES_KV;
  }

  async healthCheck(nodes) {
    const checkPromises = nodes.map(async (node) => {
      try {
        const startTime = Date.now();
        const response = await fetch(`https://${node.server}:${node.port}`, {
          signal: AbortSignal.timeout(5000)
        });
        const latency = Date.now() - startTime;
        
        return {
          ...node,
          alive: response.ok,
          latency,
          lastCheck: new Date().toISOString()
        };
      } catch (error) {
        return {
          ...node,
          alive: false,
          latency: -1,
          lastCheck: new Date().toISOString()
        };
      }
    });

    return Promise.all(checkPromises);
  }

  // 中国节点长期保留策略
  async manageChinaNodes(nodes) {
    const chinaNodes = nodes.filter(node => this.isChinaNode(node));
    const overseasNodes = nodes.filter(node => !this.isChinaNode(node));
    
    // 中国节点：3天周期检查
    const now = Date.now();
    const validChinaNodes = chinaNodes.filter(node => {
      const lastCheck = new Date(node.lastCheck).getTime();
      return (now - lastCheck) < 3 * 24 * 60 * 60 * 1000; // 3天
    });

    // 海外节点：立即清理失效节点
    const validOverseasNodes = overseasNodes.filter(node => node.alive);

    return [...validChinaNodes, ...validOverseasNodes];
  }
}