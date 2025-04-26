const { proxies } = require('../config/env');

function getRandomProxy() {
  if (proxies.length === 0) return null;
  return proxies[Math.floor(Math.random() * proxies.length)];
}

function formatProxy(proxyString) {
  if (!proxyString) return null;
  
  let proxy = proxyString.trim();
  if (proxy.includes('://')) {
    proxy = proxy.split('://')[1];
  }
  
  let auth = '';
  let address = proxy;
  
  if (proxy.includes('@')) {
    const parts = proxy.split('@');
    auth = parts[0];
    address = parts[1];
  }
  
  const [host, port] = address.split(':');
  
  let username = '';
  let password = '';
  if (auth) {
    const authParts = auth.split(':');
    username = authParts[0];
    password = authParts.length > 1 ? authParts[1] : '';
  }
  
  return {
    host,
    port: parseInt(port, 10),
    auth: auth ? { username, password } : undefined
  };
}

module.exports = { getRandomProxy, formatProxy };
