import {commonHelpers} from '../base';

export const request = async (path: string, method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE', body?: any) => {
    const url = path.includes('https://') ? path : `${commonHelpers.cloudflareApiBaseUrl}/zones/${commonHelpers.cloudflareZoneId}/${path}`;

    const response = await fetch(url, {
        method: method,
        headers: {
            Authorization: `Bearer ${commonHelpers.cloudflareApiToken}`,
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