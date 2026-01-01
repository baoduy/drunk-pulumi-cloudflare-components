import * as pulumi from "@pulumi/pulumi";

export async function getTunnelToken(accountId:string, tunnelId:string): Promise<string> {

        const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/cfd_tunnel/${tunnelId}/token`;
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
                'Content-Type': 'application/json',
            },
        });

        return response.ok?JSON.parse(await response.text()).result:'';

}

export function getTunnelTokenOutput(accountId:pulumi.Input<string>, tunnelId:pulumi.Input<string>): pulumi.Output<string> {
    return pulumi.output([accountId,tunnelId]).apply(async ([accountId, tunnelId]) => {
        return getTunnelToken(accountId, tunnelId);
    });
}