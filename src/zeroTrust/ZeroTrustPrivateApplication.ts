import * as pulumi from '@pulumi/pulumi';
import { Inputs, Output } from '@pulumi/pulumi';
import { BaseComponent } from '../base';
import * as cf from '@pulumi/cloudflare';

export interface ZeroTrustPrivateApplicationArgs {
  name: string;
  routes: Array<{ cidr: pulumi.Input<string>; port: pulumi.Input<number> }>;
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
    return { appId: this.appId };
  }

  private createApplication() {
    const { name, routes, virtualNetworkId, policies } = this.args;
    const app = new cf.ZeroTrustAccessApplication(
      `${this.name}-private-app`,
      {
        accountId: this.accountId,
        name,
        allowAuthenticateViaWarp: true,
        allowIframe: false,
        autoRedirectToIdentity: true,
        type: 'self_hosted',
        policies: policies ? policies.map((p) => ({ id: p })) : [],
        destinations: routes.map((ip) => ({
          cidr: ip.cidr,
          l4Protocol: 'tcp',
          portRange: ip.port.toString(),
          type: 'private',
          vnetId: virtualNetworkId,
        })),
      },
      { parent: this },
    );

    return app;
  }

  private createRoute() {
    const { routes, tunnelId, virtualNetworkId, description } = this.args;
    routes.map(
      (ip) =>
        new cf.ZeroTrustTunnelCloudflaredRoute(
          `${this.name}-private-route-${ip.cidr}`,
          {
            accountId: this.accountId!,
            network: ip.cidr,
            tunnelId: tunnelId,
            comment: description,
            virtualNetworkId: virtualNetworkId,
          },
          { parent: this },
        ),
    );
  }
}
