import * as pulumi from '@pulumi/pulumi';
import {Inputs, Output} from '@pulumi/pulumi';
import {BaseComponent} from '../base';
import * as cf from '@pulumi/cloudflare';
import {DnsRecordsResource} from "../domain";

export type PublicHostNameArgs = {
    fqdn: string,
    protocol: 'tcp' | 'udp' | 'http' | 'https',
    ipAddress: string,
    port?: number
};

export interface ZeroAnonymousApplicationArgs {
    /** Public Apps allow to access from internet and not requires any Authentication.*/
    anonymousHosts?: Array<PublicHostNameArgs>;
    tunnelId: pulumi.Input<string>;
}

export class ZeroAnonymousApplication extends BaseComponent<ZeroAnonymousApplicationArgs> {
    constructor(name: string, args: ZeroAnonymousApplicationArgs, opts?: pulumi.ComponentResourceOptions) {
        super('ZeroAnonymousApplication', name, args, opts);
        this.createAnonymousRoutes();
        this.registerOutputs();
    }

    public getOutputs(): Inputs | Output<Inputs> {
        return {};
    }

    private createPublicRoute(args: PublicHostNameArgs) {
        const {tunnelId} = this.args;
        const dns = new DnsRecordsResource(`${this.name}-dns-${args.fqdn}`, {
            records: [{
                name: args.fqdn.split(".")[0],
                type: 'CNAME',
                content: pulumi.interpolate`${tunnelId}.cfargotunnel.com`,
                proxied: true,
                ttl: 1000
            }],
            zoneId: this.zoneId!,
        }, {...this.opts, parent: this,});

        return new cf.ZeroTrustTunnelCloudflaredConfig(`${this.name}-public-route-${args.fqdn}`, {
            accountId: this.accountId!,
            config: {
                ingresses: [{
                    hostname: args.fqdn,
                    service: `${args.protocol}://${args.ipAddress}:${args.port}`,
                    path: '/',
                    originRequest: {httpHostHeader: args.fqdn}
                }, {
                    "service": "http_status:404"
                }],
            },
            tunnelId,
            source: 'cloudflare'
        }, {
            dependsOn: dns,
            parent: this
        });
    }

    private createAnonymousRoutes() {
        const {anonymousHosts} = this.args;
        return anonymousHosts?.map(h => this.createPublicRoute(h));
    }
}
