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
            tunnelId,
            config: {
                ingresses: [{
                    hostname: args.fqdn,
                    service: `${args.protocol}://${args.ipAddress.split("/")[0]}:${args.port ?? this.getDefaultPorts(args.protocol)}`,
                    path: args.path,
                    originRequest: {
                        originServerName: args?.passThroughHostHeader ? args.fqdn : undefined,
                        noTlsVerify: args?.ignoreSslValidation ?? false,
                    },
                },
                    {
                        service: "http_status:404"
                    }
                ],
            },
        }, {
            dependsOn: dns,
            parent: this,
        });
    }

    private createAnonymousRoutes() {
        const {anonymousHosts, tunnelId} = this.args;
        if (!anonymousHosts || anonymousHosts.length === 0) return undefined;

        //create DNS
        const dsn = anonymousHosts.map(h => new DnsRecordsResource(`${this.name}-dns-${h.fqdn}`, {
            records: [{
                name: h.fqdn.split(".")[0],
                type: 'CNAME',
                content: pulumi.interpolate`${tunnelId}.cfargotunnel.com`,
                proxied: true,
                ttl: 1000
            }],
            zoneId: this.zoneId!,
        }, {...this.opts, parent: this,}));

        return new cf.ZeroTrustTunnelCloudflaredConfig(`${this.name}-public-routes`, {
            accountId: this.accountId!,
            tunnelId,
            config: {
                ingresses: [...anonymousHosts.map(h => ({
                    hostname: h.fqdn,
                    service: `${h.protocol}://${h.ipAddress.split("/")[0]}:${h.port ?? this.getDefaultPorts(h.protocol)}`,
                    path: h.path,
                    originRequest: {
                        originServerName: h?.passThroughHostHeader ? h.fqdn : undefined,
                        noTlsVerify: h?.ignoreSslValidation ?? false,
                    }
                })), {
                    service: "http_status:404"
                }
                ],
            },
        }, {
            dependsOn: dsn,
            parent: this,
        });
    }
}
