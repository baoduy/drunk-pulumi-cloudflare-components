import {BaseComponent} from './Bases';
import * as pulumi from '@pulumi/pulumi';
import * as cf from '@pulumi/cloudflare';

export interface CloudflareAccountArgs {
    zeroTrust?: {
        organization?: Partial<Omit<cf.ZeroTrustOrganizationArgs, 'accountId' | 'zoneId' | 'name'>>,
    }
}

export class CloudflareAccount extends BaseComponent<CloudflareAccountArgs> {
    constructor(name: string, args: CloudflareAccountArgs, opts?: pulumi.ComponentResourceOptions) {
        super('CloudflareAccount', name, args, opts);

        const organization = this.createOrganization();

        this.registerOutputs();
    }

    public getOutputs() {
        return {};
    }

    private createOrganization() {
        const {zeroTrust} = this.args;
        const organization = zeroTrust?.organization;
        if (!organization) return;

        return new cf.ZeroTrustOrganization(`${this.name}-org`, {

            ...organization,
        }, {
            ...this.opts, parent: this, retainOnDelete: true
        });

    }
}