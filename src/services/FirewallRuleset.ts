import {BaseOptions, BaseProvider, BaseResource, commonHelpers} from "../base";
import * as pulumi from "@pulumi/pulumi";
import Cloudflare from "cloudflare";

export interface FirewallRulesetInputs extends Pick<Cloudflare.Rulesets.RulesetCreateParams, 'rules' | 'phase'> {
    zoneId?: string;
    description?: string
}

export interface FirewallRulesetOutputs extends FirewallRulesetInputs {

}

const getOrCreateRuleset = async (client: Cloudflare, inputs: FirewallRulesetInputs): Promise<Cloudflare.Rulesets.PhaseGetResponse> => {
    const set = await client.rulesets.phases.get(inputs.phase, {zone_id: inputs.zoneId}).catch(() => undefined);
    if (set) return set;
    return client.rulesets.create({
        zone_id: inputs.zoneId,
        description: inputs.description,
        kind: 'zone',
        phase: inputs.phase,
        name: 'default',
        rules: []
    });
}

class FirewallRulesetProvider extends BaseProvider<FirewallRulesetInputs, FirewallRulesetOutputs> {
    constructor(private name: string) {
        super();
    }

    public async create(inputs: FirewallRulesetInputs): Promise<pulumi.dynamic.CreateResult<FirewallRulesetOutputs>> {
        const client = commonHelpers.getCloudflareClient();
        const zoneId = inputs.zoneId || commonHelpers.cloudflareZoneId;

        const set = await getOrCreateRuleset(client, inputs);
        await client.rulesets.phases.update(set.phase, {
            description: set.description,
            rules: inputs.rules,
            zone_id: zoneId
        });

        return {id: set.id, outs: {...inputs, zoneId}}
    }

    public async delete(id: string, props: FirewallRulesetOutputs): Promise<void> {
        await this.create({...props, rules: [],});
    }

    public async update(id: string, olds: FirewallRulesetOutputs, news: FirewallRulesetInputs): Promise<pulumi.dynamic.UpdateResult<FirewallRulesetOutputs>> {
        return await this.create(news);
    }
}

export class FirewallRulesetResource extends BaseResource<FirewallRulesetInputs, FirewallRulesetOutputs> {
    constructor(name: string, props: BaseOptions<FirewallRulesetInputs>, opts?: pulumi.CustomResourceOptions) {
        super(new FirewallRulesetProvider(name), `drunk:cloudflare:FirewallRuleset:${name}`, props, opts);
    }
}