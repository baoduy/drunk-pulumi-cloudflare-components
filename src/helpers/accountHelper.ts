import * as pulumi from "@pulumi/pulumi";
import {commonHelpers} from '../base';

export const request = async (path: string, method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE', body?: any) => {
    const url = path.includes('https://') ? path : `${commonHelpers.cloudflareApiBaseUrl}/accounts/${commonHelpers.cloudflareAccountId}/${path}`;

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

export async function getTunnelToken(tunnelId: string): Promise<string> {
    return request(`cfd_tunnel/${tunnelId}/token`, 'GET');
}

export function getTunnelTokenOutput(tunnelId: pulumi.Input<string>): pulumi.Output<string> {
    return pulumi.output(tunnelId).apply(async (tunnelId) => {
        return getTunnelToken(tunnelId);
    });
}