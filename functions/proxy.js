// netlify/functions/proxy.js
exports.handler = async function (event) {
    // 1. 从环境变量获取 Token 和实例地址
    const token = process.env.MASTODON_TOKEN;
    const instance = process.env.MASTODON_INSTANCE || 'https://cmx.go.it'; // 这里改成你的实例地址

    // 2. 解析前端传来的路径，比如 event.path 可能是 /api/proxy?path=timelines/home
    const queryString = new URLSearchParams(event.queryStringParameters);
    const targetPath = queryString.get('path');

    if (!targetPath) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Missing path parameter' }),
        };
    }

    try {
        // 3. 在服务器端带上 Token 去请求 Mastodon 接口
        const response = await fetch(`${instance}/api/v1/${targetPath}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        // 4. 获取 Mastodon 返回的数据
        const data = await response.json();

        // 5. 把数据返回给你的前端 App
        return {
            statusCode: 200,
            body: JSON.stringify(data),
            headers: {
                'Access-Control-Allow-Origin': '*', // 允许跨域
                'Access-Control-Allow-Headers': 'Content-Type,Authorization',
            },
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message }),
        };
    }
};