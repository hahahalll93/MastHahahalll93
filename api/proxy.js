// api/proxy.js
export default async function handler(req, res) {
  const token = process.env.MASTODON_TOKEN;
  const instance = process.env.MASTODON_INSTANCE || 'https://mastodon.social';
  
  // 从查询参数获取目标路径
  const { path, ...queryParams } = req.query;
  
  if (!path) {
    return res.status(400).json({ error: 'Missing path parameter' });
  }
  
  // 构建目标 URL
  const targetUrl = `${instance}/api/v1/${path}`;
  
  // 转发请求
  const response = await fetch(targetUrl, {
    method: req.method,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: req.method !== 'GET' ? JSON.stringify(req.body) : undefined,
  });
  
  const data = await response.json();
  res.status(response.status).json(data);
}