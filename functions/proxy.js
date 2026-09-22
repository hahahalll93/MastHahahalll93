const handler = async (event, context) => {
    // 处理 CORS 预检请求
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            },
            body: '',
        };
    }

    const token = process.env.MASTODON_TOKEN;
    const instance = process.env.MASTODON_INSTANCE || 'https://mastodon.social';

    // 从查询参数获取目标路径
    const path = event.queryStringParameters.path || '';

    if (!path) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Missing path parameter' }),
        };
    }

    // 构建目标 URL
    const targetUrl = `instance/api/v1/{path}`;

    // 解析查询参数
    const { path: _, ...queryParams } = event.queryStringParameters || {};
    const queryString = new URLSearchParams(queryParams).toString();
    const fullUrl = queryString ? `targetUrl?{queryString}` : targetUrl;

    // 准备请求头
    const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
    };

    // 转发请求
    let body;
    if (['POST', 'PUT', 'PATCH'].includes(event.httpMethod) && event.body) {
        body = event.body;
    }

    const response = await fetch(fullUrl, {
        method: event.httpMethod,
        headers,
        body,
    });

    // 读取响应数据
    const responseData = await response.json().catch(() => null);

    // 返回响应给前端
    return {
        statusCode: response.status,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(responseData),
    };
};

exports.handler = handler;