import * as pulumi from '@pulumi/pulumi';
import {BaseOptions, BaseProvider, BaseResource} from '../base';
import Cloudflare from 'cloudflare';
import * as process from "node:process";

export interface TurnstileInput {
    name: string;
    accountId?: string;
    config: Omit<Cloudflare.Turnstile.WidgetCreateParams, 'account_id' | 'name'>
}

export interface TurnstileOutputs {
    accountId: string;
    siteKey: string;
    secret: string;
}

class TurnstileProvider extends BaseProvider<TurnstileInput, TurnstileOutputs> {
    constructor(private name: string) {
        super();
    }

    public async create(inputs: TurnstileInput): Promise<pulumi.dynamic.CreateResult> {
        const client = new Cloudflare({
            apiToken: process.env['CLOUDFLARE_API_TOKEN'],
        });

        const account_id = inputs.accountId ?? process.env.CLOUDFLARE_ACCOUNT_ID!;
        const rs = await client.turnstile.widgets.create({...inputs.config, account_id, name: inputs.name});

        return {
            id: rs.name,
            outs: {
                account_id,
                siteKey: rs.sitekey,
                secret: rs.secret,
            },
        };
    }

    public async update(id: string, olds: TurnstileOutputs, news: TurnstileInput): Promise<pulumi.dynamic.UpdateResult> {
        const client = new Cloudflare({
            apiToken: process.env['CLOUDFLARE_API_TOKEN'],
        });

        const account_id = olds.accountId;
        const rs = await client.turnstile.widgets.update(olds.siteKey, {...news.config, account_id, name: news.name});

        return {
            outs: {
                account_id,
                siteKey: rs.sitekey,
                secret: rs.secret,
            },
        };
    }

    public async delete(id: string, props: TurnstileOutputs): Promise<void> {
        const client = new Cloudflare({
            apiToken: process.env['CLOUDFLARE_API_TOKEN'],
        });
        await client.turnstile.widgets.delete(props.siteKey, {account_id: props.accountId}).catch(err => console.error(err));
    }
}

export class TurnstileResource extends BaseResource<TurnstileInput, TurnstileOutputs> {
    declare readonly name: string;
    declare readonly siteKey: pulumi.Output<string>;
    declare readonly secret: pulumi.Output<string>;

    constructor(name: string, props: BaseOptions<TurnstileInput>, opts?: pulumi.CustomResourceOptions) {
        const innerOpts = pulumi.mergeOptions(opts, {
            //This is important to tell pulumi to encrypt these outputs in the state.
            // The encrypting and decrypting will be handled bt pulumi automatically
            additionalSecretOutputs: ['siteKey', 'secret'],
        });
        super(new TurnstileProvider(name), `drunk:cloudflare:Turnstile:${name}`, {
            siteKey: undefined,
            secret: undefined,
            ...props
        }, innerOpts);
        this.name = name;
    }
}
