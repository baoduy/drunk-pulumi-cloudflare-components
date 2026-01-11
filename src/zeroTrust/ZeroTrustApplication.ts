import * as pulumi from '@pulumi/pulumi';
import {Inputs, Output} from '@pulumi/pulumi';
import {BaseComponent} from '../base';
import * as cf from '@pulumi/cloudflare';
import {DnsRecordsResource} from "../domain";

type PublicHostNameArgs = {
    fqdn: string,
    protocol: 'tcp' | 'udp' | 'http' | 'https',
    ipAddress: string,
    port?: number
};

type PrivateHostNameArgs = {
    fqdn: string, port: number,

};
type PrivateIpAddressArgs = { cidr: string, port: number, protocol?: 'tcp' | 'udp' };

export interface ZeroTrustApplicationArgs {
    name: string;
    info?: Partial<Omit<cf.ZeroTrustAccessApplicationArgs, 'accountId' | 'name' | 'destinations' | 'policies' | 'saasApp' | 'scimConfig' | 'zoneId' | 'type'>>,
    publicHostNames?: Array<PublicHostNameArgs>;
    privateHostNames?: Array<PrivateHostNameArgs>;
    privateIpAddresses?: Array<PrivateIpAddressArgs>;
    tunnelId: pulumi.Input<string>;
    virtualNetworkId?: pulumi.Input<string>;
    policies?: pulumi.Input<string>[];
}

export class ZeroTrustApplication extends BaseComponent<ZeroTrustApplicationArgs> {
    public readonly appId: pulumi.Output<string>;

    constructor(name: string, args: ZeroTrustApplicationArgs, opts?: pulumi.ComponentResourceOptions) {
        super('PublicApplications', name, args, opts);

        const app = this.createApp();
        this.createPublicRoutes(app);
        this.createPrivateRoutes(app);
        this.appId = app.id;
    }

    public getOutputs(): Inputs | Output<Inputs> {
        return {appId: this.appId};
    }

    public createPublicRoutes(app: cf.ZeroTrustAccessApplication) {
        const {publicHostNames, tunnelId} = this.args;
        return publicHostNames?.map(h => {
            const dns = new DnsRecordsResource(`${this.name}-dns-${h.fqdn}`, {
                records: [{
                    name: h.fqdn.split(".")[0],
                    type: 'CNAME',
                    content: pulumi.interpolate`${tunnelId}.cfargotunnel.com`,
                    proxied: true,
                    ttl: 1000
                }],
                zoneId: this.zoneId!,
            }, {dependsOn: app, parent: this,});

            return new cf.ZeroTrustTunnelCloudflaredConfig(`${this.name}-public-route-${h.fqdn}`, {
                accountId: this.accountId!,
                config: {
                    ingresses: [{
                        hostname: h.fqdn,
                        service: `${h.protocol}://${h.ipAddress}:${h.port}`,
                        path: '/',
                        originRequest: {httpHostHeader: h.fqdn}
                    }, {
                        "service": "http_status:404"
                    }],
                },
                tunnelId,
                source: 'cloudflare'
            }, {
                dependsOn: [app, dns],
                parent: this
            });
        });
    }

    private createApp() {
        const {name, info, publicHostNames, privateHostNames, privateIpAddresses, policies} = this.args;

        const publics = publicHostNames?.map(p => ({type: 'public', uri: p.fqdn})) || [];
        const privates = privateHostNames?.map(p => ({
            type: 'private',
            hostname: p.fqdn,
            portRange: p.port.toString()
        })) || [];
        const privateIps = privateIpAddresses?.map(p => ({
            type: 'private',
            cidr: p.cidr,
            port: p.port.toString(),
            l4Protocol: p.protocol ?? 'tcp'
        })) || [];

        return new cf.ZeroTrustAccessApplication(this.name, {
            accountId: this.accountId,
            allowAuthenticateViaWarp: policies !== undefined && policies.length > 0,
            autoRedirectToIdentity: policies !== undefined && policies.length > 0,
            allowIframe: false,
            ...info,
            type: 'self_hosted',
            name,
            policies: policies?.map((p) => ({id: p})),
            destinations: [...publics, ...privates, ...privateIps],
        }, {...this.opts, parent: this});
    }

    private createPrivateRoutes(app: cf.ZeroTrustAccessApplication) {
        const {privateIpAddresses, tunnelId, virtualNetworkId} = this.args;
        return privateIpAddresses?.map(
            (ip) =>
                new cf.ZeroTrustTunnelCloudflaredRoute(
                    `${this.name}-private-route-${ip.cidr}`,
                    {
                        accountId: this.accountId!,
                        network: ip.cidr,
                        tunnelId: tunnelId,
                        virtualNetworkId: virtualNetworkId,
                    },
                    {dependsOn: app, parent: this},
                ),
        );
    }

    private createPrivateHosts(app: cf.ZeroTrustAccessApplication) {
    }
}
