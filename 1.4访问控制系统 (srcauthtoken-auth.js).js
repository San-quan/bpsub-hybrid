export class TokenAuth {
  constructor(env) {
    this.env = env;
    this.mainToken = env.MAIN_TOKEN;
    this.guestToken = env.GUEST_TOKEN || this.generateGuestToken();
  }

  validateToken(token) {
    if (token === this.mainToken) {
      return { valid: true, type: 'main', rateLimit: 1000 };
    }
    if (token === this.guestToken) {
      return { valid: true, type: 'guest', rateLimit: 100 };
    }
    return { valid: false };
  }

  generateGuestToken() {
    return 'guest_' + Math.random().toString(36).substr(2, 9);
  }

  async handleUnauthorized(request) {
    // 异常访问重定向
    return new Response('Unauthorized', {
      status: 302,
      headers: {
        'Location': 'https://github.com/San-quan/museStarlinkpay71'
      }
    });
  }
}