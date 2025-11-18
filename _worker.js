export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    const { TOKEN, GUEST, SUBNAME, SUBCONFIG, TGTOKEN, TGID } = env;

    const tg = async (msg) => {
      if (TGTOKEN && TGID) {
        await fetch(`https://api.telegram.org/bot${TGTOKEN}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: TGID, text: msg })
        }).catch(() => {});
      }
    };

    // 检查是否保存操作（仅保存时记录，不发送通知）
    const shouldNotify = async (action) => {
      const lastNotify = await env.KV_MAIN.get('last_notify_time');
      const now = Date.now();
      const oneDay = 24 * 60 * 60 * 1000;
      
      // 只记录操作到 KV，不立即发送通知
      await env.KV_MAIN.put('last_action', JSON.stringify({
        action,
        time: new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Hong_Kong' })
      }));
      
      return false; // 不立即发送通知
    };

    if (path === `/${TOKEN}`) {
      if (request.method === 'GET') {
        const links = await env.KV_MAIN.get('links') || '';
        return new Response(`
<!DOCTYPE html>
<html lang="zh-HK">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${SUBNAME}</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">
  <script src="https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js"></script>
  <style>
    :root {
      --primary: #00d4ff;
      --accent: #ff00a0;
      --dark: #0a0a0a;
      --glass: rgba(10, 10, 10, 0.7);
    }
    body {
      background: linear-gradient(135deg, #0a0a0a, #1a0033), url('https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1600&q=80') center/cover no-repeat fixed;
      color: #e0f7ff;
      font-family: 'Segoe UI', system-ui, sans-serif;
      min-height: 100vh;
      backdrop-filter: blur(8px);
    }
    .glass-card {
      background: var(--glass);
      border: 1px solid rgba(0, 212, 255, 0.3);
      border-radius: 1.5rem;
      backdrop-filter: blur(12px);
      box-shadow: 0 8px 32px rgba(0, 212, 255, 0.2);
    }
    .neon-text {
      color: var(--primary);
      text-shadow: 0 0 10px var(--primary), 0 0 20px var(--accent);
      animation: glow 2s ease-in-out infinite alternate;
    }
    @keyframes glow {
      from { text-shadow: 0 0 10px var(--primary), 0 0 20px var(--accent); }
      to { text-shadow: 0 0 20px var(--primary), 0 0 40px var(--accent); }
    }
    .btn-neon {
      background: linear-gradient(45deg, var(--primary), var(--accent));
      border: none;
      color: white;
      font-weight: bold;
      transition: all 0.3s;
    }
    .btn-neon:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 20px rgba(0, 212, 255, 0.4);
    }
    textarea {
      background: rgba(0,0,0,0.5) !important;
      border: 1px solid var(--primary) !important;
      color: #e0f7ff !important;
      font-family: 'Courier New', monospace;
    }
    #qrcode canvas {
      border: 2px solid var(--primary);
      border-radius: 1rem;
      padding: 0.5rem;
      background: white;
    }
    .mode-toggle {
      position: fixed;
      top: 1rem;
      right: 1rem;
      z-index: 1000;
    }
    .latency-good { color: #00ff88; }
    .latency-ok { color: #ffff00; }
    .latency-bad { color: #ff0088; }
  </style>
</head>
<body>
  <button class="btn btn-outline-light mode-toggle" onclick="toggleMode()">
    <i class="bi bi-moon-stars-fill" id="mode-icon"></i>
  </button>
  <div class="container py-5">
    <div class="text-center mb-5">
      <h1 class="display-4 neon-text fw-bold">
        <i class="bi bi-stars"></i> ${SUBNAME.replace('By:JackSan', '').trim()}
      </h1>
      <p class="text-light opacity-75">Hong Kong Optimized · 香港本地优化 · 低延迟直连</p>
    </div>
    <!-- IP对比与网速检测卡片 -->
    <div class="glass-card p-4 mb-4">
      <div class="row text-center mb-3">
        <div class="col-md-6 mb-3 mb-md-0">
          <h6 class="text-light mb-2"><i class="bi bi-house"></i> 本地IP</h6>
          <code id="localIP" class="bg-dark text-warning p-2 rounded">检测中...</code>
          <div id="localLocation" class="text-light small mt-1 opacity-75"></div>
        </div>
        <div class="col-md-6">
          <h6 class="text-light mb-2"><i class="bi bi-shield-check"></i> 代理IP</h6>
          <code id="proxyIP" class="bg-dark text-success p-2 rounded">检测中...</code>
          <div id="proxyLocation" class="text-light small mt-1 opacity-75"></div>
        </div>
      </div>
      <div class="row text-center">
        <div class="col-md-12">
          <h6 class="text-light mb-2"><i class="bi bi-speedometer2"></i> 网速测试</h6>
          <div id="speedResult" class="text-info">
            <span class="latency-good">下载: -- Mbps</span> | 
            <span class="latency-ok">上传: -- Mbps</span> | 
            <span class="latency-bad">延迟: -- ms</span>
          </div>
        </div>
      </div>
      <div class="text-center mt-3">
        <button class="btn btn-outline-info btn-sm me-2" onclick="refreshIP()">
          <i class="bi bi-arrow-clockwise"></i> 刷新IP
        </button>
        <button class="btn btn-outline-warning btn-sm" onclick="testSpeed()">
          <i class="bi bi-lightning-charge"></i> 测速
        </button>
      </div>
    </div>
    <!-- 订阅卡片 -->
    <div class="glass-card p-4 mb-4">
      <div class="text-center">
        <p class="mb-3 text-light"><strong>主订阅地址</strong></p>
        <code class="bg-dark text-info p-2 rounded" id="subUrl"></code>
        <button class="btn btn-neon btn-sm ms-2" onclick="copySub()">
          <i class="bi bi-clipboard"></i> 复制
        </button>
        <div id="qrcode" class="mt-3"></div>
      </div>
    </div>
    <!-- 节点管理卡片 -->
    <div class="glass-card p-4">
      <textarea class="form-control mb-3" rows="10" id="links" placeholder="在此粘贴你的节点（vless:// vmess:// https://）...">${links}</textarea>
      
      <div class="d-flex justify-content-between align-items-center mb-3">
        <span class="text-light">节点数: <strong id="count" class="text-info">0</strong></span>
        <button class="btn btn-outline-info btn-sm" onclick="testLatency()">
          <i class="bi bi-speedometer2"></i> 测速
        </button>
      </div>
      <div class="d-grid mb-3">
        <button class="btn btn-neon btn-lg" onclick="save()">
          <i class="bi bi-save"></i> 保存节点
        </button>
      </div>
      <div class="text-center">
        <small id="latency" class="text-light opacity-75">香港本地测速结果将显示在这里</small>
      </div>
    </div>
    <div class="text-center mt-4">
      <p class="text-light small opacity-50">
        <i class="bi bi-shield-lock"></i> Cloudflare KV 存储 · 
        <i class="bi bi-bell"></i> Telegram 实时通知 · 
        <i class="bi bi-globe-asia-australia"></i> 香港优化
      </p>
    </div>
  </div>
  <script>
    const textarea = document.getElementById('links');
    const countSpan = document.getElementById('count');
    const latencyEl = document.getElementById('latency');
    const subUrlEl = document.getElementById('subUrl');
    
    // 设置订阅地址
    const subUrl = location.origin + '/sub?token=${TOKEN}';
    subUrlEl.textContent = subUrl;
    
    // 节点计数
    function updateCount() {
      const lines = textarea.value.trim().split('\\n').filter(l => l.trim());
      countSpan.textContent = lines.length;
    }
    
    // 二维码
    new QRCode(document.getElementById("qrcode"), {
      text: subUrl,
      width: 180, height: 180,
      colorDark: "#000", colorLight: "#fff"
    });
    
    textarea.addEventListener('input', updateCount);
    updateCount();
    
    // IP检测
    async function checkIP() {
      document.getElementById('localIP').textContent = '检测中...';
      document.getElementById('proxyIP').textContent = '检测中...';
      
      try {
        // 检测本地IP
        const localResp = await fetch('https://1.1.1.1/cdn-cgi/trace');
        const localText = await localResp.text();
        const localIP = localText.match(/ip=([^\\n]+)/)?.[1] || '未知';
        const localLoc = localText.match(/loc=([^\\n]+)/)?.[1] || '';
        const localColo = localText.match(/colo=([^\\n]+)/)?.[1] || '';
        
        document.getElementById('localIP').textContent = localIP;
        document.getElementById('localLocation').textContent = 
          localLoc ? '\\uD83D\\uDCCD ' + localLoc + (localColo ? ' (' + localColo + ')' : '') : '';
        
        // 检测代理IP
        const proxyIP = localIP;
        document.getElementById('proxyIP').textContent = proxyIP;
        document.getElementById('proxyLocation').textContent = 
          localLoc ? '\\uD83D\\uDCCD ' + localLoc + (localColo ? ' (' + localColo + ')' : '') : '';
        
        // 异步获取详细位置(ipapi.co)
        setTimeout(() => {
          fetch('https://ipapi.co/json/')
            .then(r => r.json())
            .then(data => {
              if (data.ip) {
                document.getElementById('proxyIP').textContent = data.ip;
                const loc = [data.city, data.region, data.country_name, data.org].filter(x => x).join(' ');
                if (loc) {
                  document.getElementById('proxyLocation').textContent = '\\uD83D\\uDCCD ' + loc;
                }
              }
            })
            .catch(err => {
              console.log('详细位置获取失败(使用基础信息):', err);
            });
        }, 100);
        
      } catch (e) {
        document.getElementById('localIP').textContent = '检测失败';
        document.getElementById('proxyIP').textContent = '检测失败';
        console.error('IP检测错误:', e);
      }
    }
    
    // 网速测试
    async function testSpeed() {
      const resultEl = document.getElementById('speedResult');
      resultEl.innerHTML = '<span class="text-info">测速中...</span>';
      
      try {
        // 测试下载速度 (使用Cloudflare测试文件)
        const downloadStart = Date.now();
        const downloadResp = await fetch('https://speed.cloudflare.com/__down?bytes=5000000'); // 5MB
        const downloadBlob = await downloadResp.blob();
        const downloadTime = (Date.now() - downloadStart) / 1000;
        const downloadSpeed = ((5 * 8) / downloadTime).toFixed(2); // Mbps
        
        // 测试延迟
        const pingStart = Date.now();
        await fetch('https://1.1.1.1/cdn-cgi/trace');
        const ping = Date.now() - pingStart;
        
        // 测试上传速度 (模拟小文件上传)
        const uploadStart = Date.now();
        const uploadData = new Blob([new ArrayBuffer(1000000)]); // 1MB
        await fetch('https://speed.cloudflare.com/__up', { 
          method: 'POST', 
          body: uploadData 
        }).catch(() => {});
        const uploadTime = (Date.now() - uploadStart) / 1000;
        const uploadSpeed = ((1 * 8) / uploadTime).toFixed(2); // Mbps
        
        resultEl.innerHTML = 
          '<span class="latency-good">下载: ' + downloadSpeed + ' Mbps</span> | ' +
          '<span class="latency-ok">上传: ' + uploadSpeed + ' Mbps</span> | ' +
          '<span class="latency-bad">延迟: ' + ping + ' ms</span>';
      } catch (e) {
        resultEl.innerHTML = '<span class="text-danger">测速失败，请检查网络连接</span>';
      }
    }
    
    function refreshIP() {
      document.getElementById('localIP').textContent = '检测中...';
      document.getElementById('proxyIP').textContent = '检测中...';
      checkIP();
    }
    
    // 页面加载时检测IP
    checkIP();
    
    // 保存
    async function save() {
      const btn = event.target;
      const original = btn.innerHTML;
      btn.disabled = true;
      btn.innerHTML = '<i class="bi bi-hourglass-split"></i> 保存中...';
      try {
        const resp = await fetch(location.pathname, { 
          method: 'POST', 
          body: textarea.value,
          headers: { 'Content-Type': 'text/plain' }
        });
        if (!resp.ok) throw new Error('HTTP ' + resp.status);
        const msg = await resp.text();
        alert(msg);
        if (msg.includes('成功')) updateCount();
      } catch (e) {
        alert('网络错误: ' + e.message);
        console.error(e);
      } finally {
        btn.disabled = false;
        btn.innerHTML = original;
      }
    }
    
    // 复制
    function copySub() {
      navigator.clipboard.writeText(subUrl).then(() => {
        alert('订阅地址已复制！');
      });
    }
    
    // 测速（香港本地优化）
    async function testLatency() {
      latencyEl.innerHTML = '<span class="text-info">⚠️ 浏览器无法直接测试节点延迟，请使用客户端测速</span>';
      setTimeout(() => {
        latencyEl.innerHTML = '<span class="text-light opacity-75">香港本地测速结果将显示在这里</span>';
      }, 3000);
    }
    
    // 深色模式（已默认深色）
    function toggleMode() {
      const icon = document.getElementById('mode-icon');
      icon.classList.toggle('bi-moon-stars-fill');
      icon.classList.toggle('bi-sun-fill');
    }
  </script>
</body>
</html>
`, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
      }

      if (request.method === 'POST') {
        const body = await request.text();
        await env.KV_MAIN.put('links', body.trim());
        const inputLines = body.trim().split('\n').filter(l => l);
        
        // 解析实际节点数
        let actualCount = 0;
        for (const line of inputLines) {
          const t = line.trim();
          if (/^(vless|vmess|trojan|ss):\/\//i.test(t)) {
            actualCount++;
          } else if (/^https?:\/\//i.test(t)) {
            try {
              const r = await fetch(t, { signal: AbortSignal.timeout(30000) });
              if (r.ok) {
                const txt = await r.text();
                const decoded = txt.includes('://') ? txt : (txt.trim().length > 0 && btoa(atob(txt.trim())) === txt.trim() ? atob(txt.trim()) : txt);
                actualCount += decoded.trim().split('\n').filter(l => l && /^(vless|vmess|trojan|ss):\/\//i.test(l.trim())).length;
              }
            } catch (e) {
              actualCount++; // 订阅链接本身算1个
            }
          }
        }
        
        await shouldNotify(`节点更新 - 输入${inputLines.length}条，解析${actualCount}个节点`);
        return new Response(`保存成功！输入 ${inputLines.length} 条订阅链接，解析出 ${actualCount} 个实际节点`);
      }
    }

    if (path === '/sub' && url.searchParams.get('token') === GUEST) {
      const guest = await env.KV_GUEST.get('guest_links') || '';
      if (!guest) {
        return new Response('# 无节点');
      }
      return new Response(guest.trim(), {
        headers: { 'Content-Type': 'text/plain; charset=utf-8' }
      });
    }

    if (path === '/sub' && url.searchParams.get('token') === TOKEN) {
      let links = await env.KV_MAIN.get('links') || '';
      if (!links) return new Response('# 请先添加节点\n管理页: ' + url.origin + `/${TOKEN}`);

      const lines = links.trim().split('\n');
      let merged = [];

      for (const line of lines) {
        const t = line.trim();
        if (/^(vless|vmess|trojan|ss):\/\//i.test(t)) {
          merged.push(t);
        } else if (/^https?:\/\//i.test(t)) {
          try {
            const r = await fetch(t, { signal: AbortSignal.timeout(30000) });
            if (r.ok) {
              const txt = await r.text();
              const decoded = txt.includes('://') ? txt : (txt.trim().length > 0 && btoa(atob(txt.trim())) === txt.trim() ? atob(txt.trim()) : txt);
              merged = merged.concat(decoded.trim().split('\n').filter(l => l));
            }
          } catch (e) {}
        }
      }

      if (merged.length === 0) return new Response('# 所有节点无效');

      const isB64 = merged[0].includes('://') ? false : true;
      if (isB64) {
        return new Response(btoa(merged.join('\n')), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
      } else {
        // 尝试多个转换服务
        const converters = [
          'https://sub.xeton.dev/sub',
          'https://api.dler.io/sub',
          'https://sub-web.netlify.app/api/v1/sub'
        ];
        
        const base64Nodes = btoa(merged.join('\n'));
        let result = null;
        
        for (const converter of converters) {
          try {
            const params = new URLSearchParams({
              target: 'clash',
              url: base64Nodes,
              insert: 'false',
              config: SUBCONFIG,
              emoji: 'true',
              list: 'false',
              udp: 'true',
              tfo: 'false',
              expand: 'true',
              scv: 'true',
              fdn: 'false',
              new_name: 'true'
            });
            const fetchUrl = `${converter}?${params.toString()}`;
            const resp = await fetch(fetchUrl, { 
              signal: AbortSignal.timeout(45000),
              headers: {
                'User-Agent': 'clash'
              }
            });
            if (resp.ok) {
              result = await resp.text();
              // 检查返回是否是有效的 YAML，并且包含多个节点
              if (result && result.includes('proxies:') && result.split('- name:').length > 2) {
                return new Response(result, { headers: { 'Content-Type': 'text/yaml; charset=utf-8' } });
              }
            }
          } catch (e) {
            continue;
          }
        }
        
        // 所有转换服务都失败，返回 Base64 格式
        await shouldNotify('订阅获取');
        return new Response(base64Nodes, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
      }
    }

    return new Response('404', { status: 404 });
  },

    // 定时任务:每3天检查节点健康度,清理失效节点
  async scheduled(event, env, ctx) {
    const { TGTOKEN, TGID, TOKEN } = env;
    
    if (!TGTOKEN || !TGID) return;

    try {
      const links = await env.KV_MAIN.get('links') || '';
      if (!links) return;

      const lines = links.trim().split('\n').filter(l => l.trim());
      const healthData = JSON.parse(await env.KV_MAIN.get('node_health') || '{}');
      const now = Date.now();
      const threeDays = 3 * 24 * 60 * 60 * 1000;
      
      let validLinks = [];
      let removedNodes = [];
      let newFailures = [];

      for (const line of lines) {
        const t = line.trim();
        let isValid = false;
        let nodeName = t.substring(0, 50);

        // 检查订阅链接或节点
        if (/^https?:\/\//i.test(t)) {
          try {
            const r = await fetch(t, { 
              signal: AbortSignal.timeout(30000),
              headers: { 'User-Agent': 'Mozilla/5.0' }
            });
            isValid = r.ok;
            if (!isValid) {
              nodeName = `订阅 ${new URL(t).hostname}`;
            }
          } catch (e) {
            isValid = false;
            nodeName = `订阅 ${new URL(t).hostname}`;
          }
        } else if (/^(vless|vmess|trojan|ss):\/\//i.test(t)) {
          // 简单格式检查
          try {
            const url = new URL(t);
            isValid = url.hostname && url.port;
            // 提取节点名称
            const nameMatch = t.match(/[?&#]remarks?=([^&#]+)/i) || t.match(/#(.+)$/);
            if (nameMatch) nodeName = decodeURIComponent(nameMatch[1]);
          } catch (e) {
            isValid = false;
          }
        }

        // 健康度判断
        if (isValid) {
          // 节点恢复,清除失败记录
          if (healthData[t]) delete healthData[t];
          validLinks.push(line);
        } else {
          // 记录或更新失败
          if (!healthData[t]) {
            healthData[t] = { 
              firstFail: now, 
              name: nodeName,
              count: 1 
            };
            newFailures.push(nodeName);
          } else {
            healthData[t].count++;
            // 连续2次失败(6天)则删除
            if (now - healthData[t].firstFail >= 2 * threeDays) {
              removedNodes.push(healthData[t].name);
              delete healthData[t];
            } else {
              validLinks.push(line); // 首次失败保留
            }
          }
        }
      }

      // 更新 KV
      await env.KV_MAIN.put('links', validLinks.join('\n'));
      await env.KV_MAIN.put('node_health', JSON.stringify(healthData));

      // 统计信息
      const nodeCount = validLinks.length;
      const failingCount = Object.keys(healthData).length;
      
      // 构建通知消息
      let msg = `🔍 节点健康检查报告\n\n` +
                `🕐 检查时间: ${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Hong_Kong' })}\n` +
                `✅ 健康节点: ${nodeCount}个\n` +
                `⚠️ 待观察: ${failingCount}个 (将在6天后删除)\n`;

      if (newFailures.length > 0) {
        msg += `\n🆕 新增失败:\n${newFailures.slice(0, 5).map(n => `  • ${n}`).join('\n')}`;
        if (newFailures.length > 5) msg += `\n  ...等${newFailures.length}个`;
      }

      if (removedNodes.length > 0) {
        msg += `\n\n🗑️ 已清理(连续6天失败):\n${removedNodes.slice(0, 5).map(n => `  • ${n}`).join('\n')}`;
        if (removedNodes.length > 5) msg += `\n  ...等${removedNodes.length}个`;
      }

      msg += `\n\n🔗 订阅: https://baobao.snk567.cc/sub?token=${TOKEN}`;

      await fetch(`https://api.telegram.org/bot${TGTOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          chat_id: TGID, 
          text: msg
        })
      });

      await env.KV_MAIN.put('last_check_time', now.toString());
    } catch (e) {
      console.error('节点检查失败:', e);
      if (TGTOKEN && TGID) {
        await fetch(`https://api.telegram.org/bot${TGTOKEN}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            chat_id: TGID, 
            text: `❌ 节点检查异常: ${e.message}`
          })
        });
      }
    }
  }
};
