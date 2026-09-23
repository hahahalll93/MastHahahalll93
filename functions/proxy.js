// functions/proxy.js — Netlify Function：在服务端携带 Token 转发 Mastodon API 请求
// 说明：
// 1. 使用新版 Netlify Functions v2 规范：入参为标准 Request，返回标准 Response（本地与线上一致）；
// 2. 支持 GET / POST / DELETE 等全部方法，请求体（JSON / multipart form-data）原样转发；
// 3. 自动规范化 path：容忍 "statuses"、"api/v1/statuses" 两种写法；
// 4. path 中可附带查询串（如 statuses/123?delete_media=true），其余查询参数自动转发。

const DEFAULT_INSTANCE = 'https://cmx.go.it';

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  };
}

function jsonHeaders() {
  return { 'Content-Type': 'application/json', ...corsHeaders() };
}

export default async function handler(req) {
  const url = new URL(req.url);

  // 预检请求直接放行
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }

  const token = process.env.MASTODON_TOKEN;
  const instance = (process.env.MASTODON_INSTANCE || DEFAULT_INSTANCE).replace(/\/+$/, '');

  const targetPath = (url.searchParams.get('path') || '').trim();
  if (!targetPath) {
    return new Response(JSON.stringify({ error: 'Missing path parameter' }), {
      status: 400,
      headers: jsonHeaders(),
    });
  }

  // 规范化路径：去掉开头斜杠、去掉可能重复的 api/v1 前缀
  const normalized = targetPath.replace(/^\/+/, '').replace(/^api\/v1\//, '');
  const upstreamUrl = new URL(`${instance}/api/v1/${normalized}`);

  // 转发 path 以外的其它查询参数（如 limit、min_id 等）
  for (const [key, value] of url.searchParams) {
    if (key !== 'path') {
      upstreamUrl.searchParams.append(key, value);
    }
  }

  // 构造上游请求头与请求体
  const headers = new Headers({ Authorization: `Bearer ${token}` });
  let body;
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    const contentType = req.headers.get('content-type');
    if (contentType) headers.set('Content-Type', contentType);
    if (req.body) {
      body = await req.arrayBuffer();
    }
  }

  try {
    const upstream = await fetch(upstreamUrl, {
      method: req.method,
      headers,
      body,
    });

    const text = await upstream.text();
    return new Response(text, {
      status: upstream.status,
      headers: {
        ...corsHeaders(),
        'Content-Type': upstream.headers.get('content-type') || 'application/json',
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 502,
      headers: jsonHeaders(),
    });
  }
}
