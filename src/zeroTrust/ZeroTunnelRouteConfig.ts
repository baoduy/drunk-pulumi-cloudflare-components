import * as pulumi from '@pulumi/pulumi';
import {Inputs, Output} from '@pulumi/pulumi';
import {BaseComponent} from '../base';
import {DnsRecordsResource} from "../domain";
import * as cf from "@pulumi/cloudflare";

type Protocol = 'tcp' | 'udp' | 'http' | 'https';
export type PublicHostNameArgs = {
    fqdn: string,
    protocol: Protocol,
    ipAddress: string,
    path?: string,
    port?: number,
    passThroughHostHeader?: boolean,
    ignoreSslValidation?: boolean,
};

export interface ZeroTunnelRouteConfigArgs {
    /** Hosts exposed through the tunnel (DNS CNAME + ingress entry). Auth, if any, is enforced separately by an Access Application. */
    hosts: Array<PublicHostNameArgs>;
    tunnelId: pulumi.Input<string>;
}

export class ZeroTunnelRouteConfig extends BaseComponent<ZeroTunnelRouteConfigArgs> {
    constructor(name: string, args: ZeroTunnelRouteConfigArgs, opts?: pulumi.ComponentResourceOptions) {
        super('ZeroTunnelRouteConfig', name, args, opts);
        this.createRoutes();
        this.registerOutputs();
    }

    public getOutputs(): Inputs | Output<Inputs> {
        return {};
    }

    private getDefaultPorts(protocol: Protocol): number {
        switch (protocol) {
            case 'http':
                return 80;
            case 'https':
                return 443;
            case 'tcp':
                return 22;
            case 'udp':
                return 53;
            default:
                return 80;
        }
    }

    private createRoutes() {
        const {hosts, tunnelId} = this.args;
        if (!hosts || hosts.length === 0) return undefined;

        //create DNS
        const dsn = hosts.map(h => new DnsRecordsResource(`${this.name}-dns-${h.fqdn}`, {
                records: [{
                    name: h.fqdn.split(".")[0],
                    type: 'CNAME',
                    content: pulumi.interpolate`${tunnelId}.cfargotunnel.com`,
                    proxied: true,
                    ttl: 1000
                }],
                zoneId: this.zoneId!,
            },
            {dependsOn:this.opts?.dependsOn, parent: this,}));

        //Create Cloudflared Config
        return new cf.ZeroTrustTunnelCloudflaredConfig(`${this.name}-public-routes`, {
            accountId: this.accountId!,
            tunnelId,
            config: {
                ingresses: [...hosts.map(h => ({
                    hostname: h.fqdn,
                    service: `${h.protocol}://${h.ipAddress.split("/")[0]}:${h.port ?? this.getDefaultPorts(h.protocol)}`,
                    path: h.path,
                    originRequest: {
                        originServerName: h?.passThroughHostHeader ? h.fqdn : undefined,
                        noTlsVerify: h?.ignoreSslValidation ?? false,
                    }
                })), {
                    service: "http_status:404"
                }],
            },
        }, {
            parent: this,
        });
    }
}
