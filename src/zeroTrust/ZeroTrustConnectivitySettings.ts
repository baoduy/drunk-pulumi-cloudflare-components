import * as pulumi from '@pulumi/pulumi';
import {BaseOptions, BaseProvider, BaseResource,} from '../base';
import {Cloudflare} from "cloudflare";

export interface ZeroTrustConnectivitySettingsInputs {
    accountId: string;
    icmpProxyEnabled?: boolean;
    offrampWarpEnabled?: boolean;
}

export interface ZeroTrustConnectivitySettingsOutputs extends ZeroTrustConnectivitySettingsInputs {
}

class ZeroTrustConnectivitySettingsProvider extends BaseProvider<ZeroTrustConnectivitySettingsInputs, ZeroTrustConnectivitySettingsOutputs> {
    constructor(private name: string) {
        super();
    }

    public async create(inputs: ZeroTrustConnectivitySettingsInputs): Promise<pulumi.dynamic.CreateResult> {
        const cf = new Cloudflare({apiToken: process.env.CLOUDFLARE_API_TOKEN,});
        cf.zeroTrust.connectivitySettings.edit({
            account_id: inputs.accountId,
            icmp_proxy_enabled: inputs.icmpProxyEnabled,
            offramp_warp_enabled: inputs.offrampWarpEnabled
        });
        return {id: this.name, outs: inputs};
    }
}

export class ZeroTrustConnectivitySettingsResource extends BaseResource<ZeroTrustConnectivitySettingsInputs, ZeroTrustConnectivitySettingsOutputs> {
    declare readonly name: string;

    constructor(name: string, props: BaseOptions<ZeroTrustConnectivitySettingsInputs>, opts?: pulumi.CustomResourceOptions) {
        super(
            new ZeroTrustConnectivitySettingsProvider(name),
            `drunk:cloudflare:ZeroTrustConnectivitySettings:${name}`, props, opts,);
        this.name = name;
    }
}
