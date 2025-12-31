import {BaseComponent} from './Bases';
import * as pulumi from '@pulumi/pulumi';
import * as cf from '@pulumi/cloudflare';

export interface CloudflareZeroTrustAccountArgs {
    organization?: Partial<Omit<cf.ZeroTrustOrganizationArgs, 'accountId' | 'zoneId' | 'authDomain'|'name'>>&{name:string},
    identityProvider?:Omit<cf.ZeroTrustAccessIdentityProviderArgs, 'accountId' | 'zoneId' |'name'>&{
        name:string,
        type:"onetimepin"| "azureAD"| "saml"| "centrify"| "facebook"| "github"|"google-apps"| "google"| "linkedin"| "oidc"| "okta"| "onelogin"| "pingone"| "yandex"
    }
}

export class CloudflareZeroTrustAccount extends BaseComponent<CloudflareZeroTrustAccountArgs> {
    constructor(name: string, args: CloudflareZeroTrustAccountArgs, opts?: pulumi.ComponentResourceOptions) {
        super('CloudflareAccount', name, args, opts);

        const organization = this.createOrganization();
        const idp = this.createIdentityProvider();
        this.registerOutputs();
    }

    public getOutputs() {
        return {};
    }

    private createOrganization() {
        const {organization} = this.args;
        if (!organization) return;

        return new cf.ZeroTrustOrganization(`${this.name}-org`, {
            accountId:this.accountId,
            //default values but allows to be overwritten
            allowAuthenticateViaWarp:true,
            autoRedirectToIdentity:true,
            isUiReadOnly:false,
            sessionDuration:'8h',
            warpAuthSessionDuration:'24h',
            userSeatExpirationInactiveTime:'730h',
            //overrides
            ...organization,
            authDomain: `${organization.name}.cloudflareaccess.com`
        }, {
            ...this.opts, parent: this, retainOnDelete: true
        });

    }

    private createIdentityProvider() {
        const {identityProvider} = this.args;
        if (!identityProvider) return;
        return new cf.ZeroTrustAccessIdentityProvider(`${this.name}-${identityProvider.name}-idp`, {
            accountId:this.accountId,
            ...identityProvider,
        }, {
            ...this.opts, parent: this
        })
    }
}