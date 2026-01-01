import * as pulumi from '@pulumi/pulumi';
import {BaseOptions, BaseProvider, BaseResource,} from '../base';
import {Cloudflare} from "cloudflare";

export interface ZeroTrustDeviceSettingsInputs {
    accountId: string;
    /**
     * Sets the time limit, in seconds, that a user can use an override code to bypass WARP.
     */
    disableForTime?: number;
    /**
     * Enable gateway proxy filtering on TCP.
     */
    gatewayProxyEnabled?: boolean;
    /**
     * Enable gateway proxy filtering on UDP.
     */
    gatewayUdpProxyEnabled?: boolean;
    /**
     * Enable installation of cloudflare managed root certificate.
     */
    rootCertificateInstallationEnabled?: boolean;
    /**
     * Enable using CGNAT virtual IPv4.
     */
    useZtVirtualIp?: boolean;
}

export interface ZeroTrustDeviceSettingsOutputs extends ZeroTrustDeviceSettingsInputs {
}

class ZeroTrustDeviceSettingsProvider extends BaseProvider<ZeroTrustDeviceSettingsInputs, ZeroTrustDeviceSettingsOutputs> {
    constructor(private name: string) {
        super();
    }

    public async create(inputs: ZeroTrustDeviceSettingsInputs): Promise<pulumi.dynamic.CreateResult> {
        const cf = new Cloudflare({ apiToken: process.env.CLOUDFLARE_API_TOKEN, });
        await cf.zeroTrust.devices.settings.update({account_id: inputs.accountId,
            disable_for_time: inputs.disableForTime,
            gateway_proxy_enabled: inputs.gatewayProxyEnabled,
            gateway_udp_proxy_enabled: inputs.gatewayUdpProxyEnabled,
            root_certificate_installation_enabled: inputs.rootCertificateInstallationEnabled,
            use_zt_virtual_ip: inputs.useZtVirtualIp,
        });
        return { id: this.name, outs: inputs };
    }
}

export class ZeroTrustDeviceSettingsResource extends BaseResource<ZeroTrustDeviceSettingsInputs, ZeroTrustDeviceSettingsOutputs> {
    declare readonly name: string;

    constructor(name: string, props: BaseOptions<ZeroTrustDeviceSettingsInputs>, opts?: pulumi.CustomResourceOptions) {
        super(
            new ZeroTrustDeviceSettingsProvider(name),
            `drunk:cloudflare:ZeroTrustDeviceSettings:${name}`, props, opts,);
        this.name = name;
    }
}
