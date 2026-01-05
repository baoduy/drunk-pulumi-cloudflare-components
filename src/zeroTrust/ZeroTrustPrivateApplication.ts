import * as pulumi from "@pulumi/pulumi";
import {Inputs, Output} from "@pulumi/pulumi";
import {BaseComponent} from '../base';
import * as cf from '@pulumi/cloudflare';

export interface ZeroTrustPrivateApplicationArgs {
    name: string;
    ipAddresses: pulumi.Input<string>[];
    ports: pulumi.Input<number>[];
    description?: pulumi.Input<string>;
    tunnelId: pulumi.Input<string>;
    virtualNetworkId?: pulumi.Input<string>;
    policies?: pulumi.Input<string>[];
}

export class ZeroTrustPrivateApplication extends BaseComponent<ZeroTrustPrivateApplicationArgs> {
    public readonly appId: pulumi.Output<string>;

    constructor(name: string, args: ZeroTrustPrivateApplicationArgs, opts?: pulumi.ComponentResourceOptions) {
        super('PrivateApplications', name, args, opts);

        const app = this.createApplication();
        this.createRoute();

        this.appId = app.id;
    }

    public getOutputs(): Inputs | Output<Inputs> {
        return {appId: this.appId};
    }

    private createApplication() {
        const {name, ports, ipAddresses, virtualNetworkId, policies} = this.args;
        const app = new cf.ZeroTrustAccessApplication(`${this.name}-private-app`, {
            accountId: this.accountId,
            name,
            allowAuthenticateViaWarp: true,
            allowIframe: false,
            autoRedirectToIdentity: true,
            type: 'self_hosted',
            policies: policies ? policies.map(p => ({id: p})) : [],
            destinations: ipAddresses.flatMap(ip => ports.map(p => ({
                cidr: ip,
                l4Protocol: 'tcp',
                portRange: p.toString(),
                type: 'private',
                vnetId: virtualNetworkId,
            })))
        }, {parent: this});


        return app;
    }

    private createRoute() {
        const {ipAddresses, tunnelId, virtualNetworkId, description} = this.args;
        ipAddresses.map(ip => new cf.ZeroTrustTunnelCloudflaredRoute(`${this.name}-private-route-${ip}`, {
            accountId: this.accountId!,
            network: ip,
            tunnelId: tunnelId,
            comment: description,
            virtualNetworkId: virtualNetworkId
        }, {parent: this}));
    }
}