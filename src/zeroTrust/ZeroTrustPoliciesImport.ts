import * as pulumi from '@pulumi/pulumi';
import {BaseOptions, BaseProvider, BaseResource, commonHelpers} from '../base';
import Cloudflare from 'cloudflare';

export interface ZeroTrustPoliciesImportInputs {
    accountId: string;
    startPrecedence?: number;
    gatewayRules: Array<Omit<Cloudflare.ZeroTrust.Gateway.RuleCreateParams, 'account_id'>>;
}

export interface ZeroTrustPoliciesImportOutputs {
    accountId: string;
    recordIds: string[];

}


class ZeroTrustPoliciesImportProvider extends BaseProvider<
    ZeroTrustPoliciesImportInputs,
    ZeroTrustPoliciesImportOutputs
> {
    constructor(private name: string) {
        super();
    }

    public async create(inputs: ZeroTrustPoliciesImportInputs): Promise<pulumi.dynamic.CreateResult> {
        const cf = commonHelpers.getCloudflareClient();
        const account_id = inputs.accountId ?? commonHelpers.cloudflareAccountId;
        const recordIds = new Array<string>();
        if (inputs.gatewayRules.length <= 0) return {id: this.name, outs: {accountId: account_id, recordIds}};
        
        const list = await cf.zeroTrust.gateway.rules.list({account_id});
        let precedence = inputs.startPrecedence ?? 5000000;

        for (const c of inputs.gatewayRules) {
            try {
                for (const f of c.filters ?? []) {
                    const name = `${f.toUpperCase()} ${c.name}`;
                    const existed = list.result.find(i => i.name && i.name.toLowerCase() === name.toLowerCase());

                    if (existed) {
                        const record = await cf.zeroTrust.gateway.rules.update(existed.id!, {
                            ...c,
                            name,
                            precedence: precedence++,
                            //cannot update filters after created.
                            filters: existed.filters,
                            account_id
                        });
                        recordIds.push(record.id!);
                    } else {
                        const record = await cf.zeroTrust.gateway.rules.create({
                            ...c,
                            name,
                            precedence: precedence++,
                            filters: [f],
                            account_id
                        });
                        recordIds.push(record.id!);
                    }
                }
            } catch (error) {
                throw new Error(`Error processing policy "${c.name}": ${error}`);
            }
        }

        return {id: this.name, outs: {accountId: account_id, recordIds}};
    }

    public update(id: string, olds: ZeroTrustPoliciesImportOutputs, news: ZeroTrustPoliciesImportInputs): Promise<pulumi.dynamic.UpdateResult<ZeroTrustPoliciesImportOutputs>> {
        return this.create(news);
    }

    public async delete(id: string, props: ZeroTrustPoliciesImportOutputs): Promise<void> {
        const cf = commonHelpers.getCloudflareClient();
        const account_id = props.accountId ?? commonHelpers.cloudflareAccountId;

        if (props.recordIds.length > 0) {
            for (const recordId of props.recordIds) {
                await cf.zeroTrust.gateway.rules.delete(recordId, {account_id}).catch();
            }
        }
    }
}

export class ZeroTrustPoliciesImportResource extends BaseResource<
    ZeroTrustPoliciesImportInputs,
    ZeroTrustPoliciesImportOutputs
> {
    declare readonly name: string;

    constructor(name: string, props: BaseOptions<ZeroTrustPoliciesImportInputs>, opts?: pulumi.CustomResourceOptions) {
        super(new ZeroTrustPoliciesImportProvider(name), `drunk:cloudflare:ZeroTrustPoliciesImport:${name}`, props, opts);
        this.name = name;
    }
}
