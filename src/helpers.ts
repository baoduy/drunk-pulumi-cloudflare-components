import * as pulumi from "@pulumi/pulumi";

export const request = async (path:string, method:'GET'|'POST'|'PUT'|'DELETE', body?:any) => {
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

    return JSON.parse(await response.text()).result;
}

export async function getTunnelToken(accountId:string, tunnelId:string): Promise<string> {
    return request(`cfd_tunnel/${tunnelId}/token`, 'GET');
}

export function getTunnelTokenOutput(accountId:pulumi.Input<string>, tunnelId:pulumi.Input<string>): pulumi.Output<string> {
    return pulumi.output([accountId,tunnelId]).apply(async ([accountId, tunnelId]) => {
        return getTunnelToken(accountId, tunnelId);
    });
}