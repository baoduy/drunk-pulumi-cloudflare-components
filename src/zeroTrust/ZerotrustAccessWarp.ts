import * as pulumi from '@pulumi/pulumi';
import {BaseOptions, BaseProvider, BaseResource,} from '../base';
import {request} from "../helpers";

export interface ZeroTrustAccessWarpInputs {
    accountId: string;
    policies: string[];
    allowedIdps?: string[];
    autoRedirectToIdp?: boolean;
}

export interface ZeroTrustAccessWarpOutputs extends ZeroTrustAccessWarpInputs {
}

const getWrap = async (): Promise<any> => {
    return request(`access/warp`,'GET');
};

const updateWrap = async (wrap:any): Promise<any> => {
    return request(`access/warp`,'PUT',wrap);
};

class ZeroTrustAccessWarpProvider extends BaseProvider<ZeroTrustAccessWarpInputs, ZeroTrustAccessWarpOutputs> {
    constructor(private name: string) {
        super();
    }

    public async create(inputs: ZeroTrustAccessWarpInputs): Promise<pulumi.dynamic.CreateResult> {
        const body = await getWrap();
        const newBody = {...body, policies: inputs.policies};

        if(!inputs.allowedIdps||inputs.allowedIdps.length===0){
            newBody['allowed_idps']= [];
        }else {
            newBody['allowed_idps']= inputs.allowedIdps;
            newBody['auto_redirect_to_identity']= inputs.allowedIdps.length===1?true:inputs.autoRedirectToIdp;
        }
        await updateWrap(newBody);
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
