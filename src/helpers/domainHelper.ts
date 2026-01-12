import * as process from "node:process";

export const request = async (path: string, method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE', body?: any) => {
    const url = path.includes('https://') ? path : `${process.env.CLOUDFLARE_API_BASE_PATH}/zones/${process.env.CLOUDFLARE_ZONE_ID}/${path}`;

    const response = await fetch(url, {
        method: method,
        headers: {
            Authorization: `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
            'Content-Type': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined,
    }).catch(error => {
        throw new Error(`${method}:${url} Error: ${error}`);
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
            `${method}:${url}\nError: ${errorText}`
        );
    }

    return (await response.json()).result;
}