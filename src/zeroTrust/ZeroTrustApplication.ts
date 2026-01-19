import * as pulumi from '@pulumi/pulumi';
import {Inputs, Output} from '@pulumi/pulumi';
import {BaseComponent} from '../base';
import * as cf from '@pulumi/cloudflare';
import {PublicHostNameArgs, ZeroAnonymousApplication} from "./ZeroAnonymousApplication";

type PrivateHostNameArgs = {
    fqdn: string,
    port: number,
};
type PrivateIpAddressArgs = {
    cidr: string,
    port: number,
    protocol?: 'tcp' | 'udp'
};

export interface ZeroTrustApplicationArgs {
    name: string;
    info?: Partial<Omit<cf.ZeroTrustAccessApplicationArgs, 'accountId' | 'name' | 'destinations' | 'policies' | 'saasApp' | 'scimConfig' | 'zoneId' | 'type'>>,
    /** Public Apps that allow to access from internet but requires Cloudflare Authentication.*/
    publicHostNames?: Array<PublicHostNameArgs>;
    /** Private App requires Cloudflare Tunnel to access and require Cloudflare Authentication with Company device.*/
    privateHostNames?: Array<PrivateHostNameArgs>;
    /** Private App requires Cloudflare Tunnel to access and require Cloudflare Authentication with Company device.*/
    privateIpAddresses?: Array<PrivateIpAddressArgs>;
    tunnelId: pulumi.Input<string>;
    virtualNetworkId?: pulumi.Input<string>;
    policies?: pulumi.Input<string>[];
}

export class ZeroTrustApplication extends BaseComponent<ZeroTrustApplicationArgs> {
    public readonly appId: pulumi.Output<string>;

    constructor(name: string, args: ZeroTrustApplicationArgs, opts?: pulumi.ComponentResourceOptions) {
        super('ZeroTrustApplication', name, args, opts);

        const app = this.createApp();
        this.createPublicRoutes(app);
        this.createPrivateRoutes(app);
        this.createPrivateHosts(app);

        this.appId = app.id;
        this.registerOutputs();
    }

    public getOutputs(): Inputs | Output<Inputs> {
        return {appId: this.appId};
    }

    private createPublicRoutes(app: cf.ZeroTrustAccessApplication) {
        const {publicHostNames, tunnelId} = this.args;
        if (!publicHostNames || publicHostNames.length === 0) return undefined;

        return new ZeroAnonymousApplication(`${this.name}-public-routes`,
            {
                anonymousHosts: publicHostNames,
                tunnelId
            }, {
                dependsOn: app,
                parent: this
            })
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

        if (publics.length === 0 && privates.length === 0 && privateIps.length === 0) {
            throw new Error('At least one publicHostNames, privateHostNames, or privateIpAddresses must be provided.');
        }

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
        const {privateHostNames, tunnelId} = this.args;
        return privateHostNames?.map(h => new cf.ZeroTrustNetworkHostnameRoute(`${this.name}-private-host-${h.fqdn}`, {
            accountId: this.accountId!,
            hostname: h.fqdn,
            tunnelId
        }, {
            dependsOn: app,
            parent: this
        },));
    }
}
