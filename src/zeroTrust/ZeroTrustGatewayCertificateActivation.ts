import * as pulumi from '@pulumi/pulumi';
import {BaseOptions, BaseProvider, BaseResource, commonHelpers,} from '../base';

export interface ZeroTrustGatewayCertificateActivationInputs {
    accountId: string;
    certificateId: string;
}

export interface ZeroTrustGatewayCertificateActivationOutputs extends ZeroTrustGatewayCertificateActivationInputs {
    status: 'pending_deployment' | 'available' | 'pending_deletion' | 'inactive';
}

class ZeroTrustGatewayCertificateActivationProvider extends BaseProvider<ZeroTrustGatewayCertificateActivationInputs, ZeroTrustGatewayCertificateActivationOutputs> {

    constructor(private name: string) {
        super();
    }

    public async diff(id: string, previousOutput: ZeroTrustGatewayCertificateActivationOutputs, news: ZeroTrustGatewayCertificateActivationInputs): Promise<pulumi.dynamic.DiffResult> {
        return {changes: previousOutput.accountId !== news.accountId || previousOutput.certificateId !== news.certificateId,};
    }

    public async create(inputs: ZeroTrustGatewayCertificateActivationInputs): Promise<pulumi.dynamic.CreateResult> {
        const cf = commonHelpers.getCloudflareClient();
        const current = await cf.zeroTrust.gateway.certificates.get(inputs.certificateId, {account_id: inputs.accountId,});

        if (current.binding_status == "available")
            return {id: `${this.name}-${inputs.certificateId}`, outs: {...inputs, status: current.binding_status}};

        const rs = await cf.zeroTrust.gateway.certificates.activate(inputs.certificateId, {
            account_id: inputs.accountId,
            body: {}
        });
        return {id: this.name, outs: {...inputs, status: rs.binding_status}};
    }
}

export class ZeroTrustGatewayCertificateActivationResource extends BaseResource<ZeroTrustGatewayCertificateActivationInputs, ZeroTrustGatewayCertificateActivationOutputs> {
    declare readonly name: string;
    declare readonly certificateId: pulumi.Output<string>;
    declare readonly status: pulumi.Output<Pick<ZeroTrustGatewayCertificateActivationOutputs, 'status'>>;

    constructor(name: string, props: BaseOptions<ZeroTrustGatewayCertificateActivationInputs>, opts?: pulumi.CustomResourceOptions) {
        super(
            new ZeroTrustGatewayCertificateActivationProvider(name),
            `drunk:cloudflare:ZeroTrustGatewayCertificateActivation:${name}`, {...props, status: undefined}, opts,);
        this.name = name;
    }
}
