import * as pulumi from '@pulumi/pulumi';
import {BaseOptions, BaseProvider, BaseResource, commonHelpers} from '../base';
import Cloudflare from 'cloudflare';

export interface TurnstileInputs {
    name: string;
    accountId?: string;
    config: Omit<Cloudflare.Turnstile.WidgetCreateParams, 'account_id' | 'name'>
}

export interface TurnstileOutputs {
    accountId: string;
    siteKey: string;
    secret: string;
}

class TurnstileProvider extends BaseProvider<TurnstileInputs, TurnstileOutputs> {
    constructor(private name: string) {
        super();
    }

    public async create(inputs: TurnstileInputs): Promise<pulumi.dynamic.CreateResult> {
        const client = commonHelpers.getCloudflareClient();
        const account_id = inputs.accountId ?? commonHelpers.cloudflareAccountId;

        const rs = await client.turnstile.widgets.create({...inputs.config, account_id, name: inputs.name});

        return {
            id: rs.name,
            outs: {
                accountId: account_id,
                siteKey: rs.sitekey,
                secret: rs.secret,
            },
        };
    }

    public async update(id: string, olds: TurnstileOutputs, news: TurnstileInputs): Promise<pulumi.dynamic.UpdateResult> {
        const client = commonHelpers.getCloudflareClient();
        const account_id = news.accountId ?? commonHelpers.cloudflareAccountId;

        const rs = await client.turnstile.widgets.update(olds.siteKey, {...news.config, account_id, name: news.name});

        return {
            outs: {
                accountId: account_id,
                siteKey: rs.sitekey,
                secret: rs.secret,
            },
        };
    }

    public async delete(id: string, props: TurnstileOutputs): Promise<void> {
        const client = commonHelpers.getCloudflareClient();
        await client.turnstile.widgets.delete(props.siteKey, {account_id: props.accountId}).catch(err => console.error(err));
    }
}

export class TurnstileResource extends BaseResource<TurnstileInputs, TurnstileOutputs> {
    declare readonly name: string;
    declare readonly accountId: pulumi.Output<string>;
    declare readonly siteKey: pulumi.Output<string>;
    declare readonly secret: pulumi.Output<string>;

    constructor(name: string, props: BaseOptions<TurnstileInputs>, opts?: pulumi.CustomResourceOptions) {
        const innerOpts = pulumi.mergeOptions(opts, {
            //This is important to tell pulumi to encrypt these outputs in the state.
            // The encrypting and decrypting will be handled bt pulumi automatically
            additionalSecretOutputs: ['siteKey', 'secret'],
            deleteBeforeReplace: true,
            replaceOnChanges: ['accountId']
        });
        super(new TurnstileProvider(name), `drunk:cloudflare:Turnstile:${name}`, {
            siteKey: undefined,
            secret: undefined,
            ...props
        }, innerOpts);
        this.name = name;
    }
}
