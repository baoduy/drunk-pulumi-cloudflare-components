import * as pulumi from '@pulumi/pulumi';
import {BaseOptions, BaseProvider, BaseResource,} from '../base';

export interface ZeroTrustAccessWarpInputs {
    accountId: string;
    policies: string[];
    allowedIdps?: string[];
    autoRedirectToIdp?: boolean;
}

export interface ZeroTrustAccessWarpOutputs extends ZeroTrustAccessWarpInputs {
}

const getWrap = async (accountId:string): Promise<any> => {
    const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/access/warp`;

    const response = await fetch(url, {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
            'Content-Type': 'application/json',
        },
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
            `Error reading wrap app: ${response.status} ${response.statusText}\nError: ${errorText}`
        );
    }

    return JSON.parse(await response.text()).result;
};

const updateWrap = async (accountId:string,wrap:any): Promise<any> => {
    const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/access/warp`;

    const body = JSON.stringify(wrap);
    const response = await fetch(url, {
        method: 'PUT',
        headers: {
            Authorization: `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
        },
        body,
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
            `Error creating wrap app: ${response.status} ${response.statusText}\nError: ${errorText}\nBody: ${body}`
        );
    }

    return JSON.parse(await response.text()).result;
};

class ZeroTrustAccessWarpProvider extends BaseProvider<ZeroTrustAccessWarpInputs, ZeroTrustAccessWarpOutputs> {
    constructor(private name: string) {
        super();
    }

    public async create(inputs: ZeroTrustAccessWarpInputs): Promise<pulumi.dynamic.CreateResult> {
        const body = await getWrap(inputs.accountId);
        const newBody = {...body, policies: inputs.policies};

        if(!inputs.allowedIdps||inputs.allowedIdps.length===0){
            newBody['allowed_idps']= [];
        }else {
            newBody['allowed_idps']= inputs.allowedIdps;
            newBody['auto_redirect_to_identity']= inputs.allowedIdps.length===1?true:inputs.autoRedirectToIdp;
        }
        await updateWrap(inputs.accountId,newBody);
        return {id:this.name, outs: inputs};
    }
}

export class ZeroTrustAccessWarpResource extends BaseResource<ZeroTrustAccessWarpInputs, ZeroTrustAccessWarpOutputs> {
    declare readonly name: string;

    constructor(name: string, props: BaseOptions<ZeroTrustAccessWarpInputs>, opts?: pulumi.CustomResourceOptions) {
        super(
            new ZeroTrustAccessWarpProvider(name),
            `drunk:cloudflare:ZeroTrustAccessWarp:${name}`, props, opts,);
        this.name = name;
    }
}
