import * as pulumi from "@pulumi/pulumi";

export const request = async (path: string, method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE', body?: any) => {
    const url = `${process.env.CLOUDFLARE_API_BASE_PATH}/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/${path}`;

    const response = await fetch(url, {
        method: method,
        headers: {
            Authorization: `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
            'Content-Type': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
            `Error reading wrap app: ${response.status} ${response.statusText}\nError: ${errorText}`
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