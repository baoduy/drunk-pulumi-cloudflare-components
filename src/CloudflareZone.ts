import {BaseComponent} from './base';
import * as pulumi from '@pulumi/pulumi';
import {DnsRecordsInputs, DnsRecordsResource} from "./domain";
import {FirewallRulesetInputs, FirewallRulesetResource, TurnstileInputs, TurnstileResource} from "./services";

export interface CloudflareZoneArgs {
    dns?: Omit<DnsRecordsInputs, 'zoneId'>;
    turnstile?: Omit<TurnstileInputs, 'accountId'>;
    firewallRules?: Array<Omit<FirewallRulesetInputs, 'zoneId'>>;
}

export class CloudflareZone extends BaseComponent<CloudflareZoneArgs> {
    constructor(name: string, args: CloudflareZoneArgs, opts?: pulumi.ComponentResourceOptions) {
        super('CloudflareZone', name, args, opts);

        this.createDns();
        this.createTurnstile();
        this.createFirewallRules();

        this.registerOutputs();
    }

    public getOutputs(): pulumi.Inputs | pulumi.Output<pulumi.Inputs> {
        return {}
    }

    private createDns() {
        const {dns} = this.args;
        if (!dns) return undefined;

        return new DnsRecordsResource(`${this.name}-dns`, {
            zoneId: this.zoneId!,
            records: dns.records
        }, {...this.opts, parent: this});
    }

    private createTurnstile() {
        const {turnstile} = this.args;
        if (!turnstile) return undefined;

        return new TurnstileResource(`${this.name}-turnstile`, {
            ...turnstile,
            accountId: this.accountId!,
        }, {...this.opts, parent: this});
    }

    private createFirewallRules() {
        const {firewallRules} = this.args;
        if (!firewallRules) return undefined;

        return firewallRules.map(f => new FirewallRulesetResource(`${this.name}-rule-${f.phase}`, {
            ...f,
            zoneId: this.zoneId!,
        }, {...this.opts, parent: this}));
    }
}