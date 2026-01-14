import * as pulumi from '@pulumi/pulumi';
import {BaseOptions, BaseProvider, BaseResource} from '../../base';
import {CfDomainClient, OriginCertType} from '../CloudflareClient';
import crypto from 'crypto';

export interface OriginCertInputs {
    domain: string;
}

export interface OriginCertOutputs extends OriginCertType {
}

class OriginCertProvider extends BaseProvider<OriginCertInputs, OriginCertOutputs> {
    constructor(private name: string) {
        super();
    }

    public async create(inputs: OriginCertInputs): Promise<pulumi.dynamic.CreateResult> {
        const id = this.getHash();
        const client = new CfDomainClient(inputs.domain);
        const certs = await client.getOriginCerts();
        if (certs.length == 0) {
            console.log(`No origin cert found for domain ${inputs.domain}, creating one...`);
            return {id, outs: {}};
        }
        const cert = certs[0];
        return {id, outs: cert};
    }

    async update(id: string, olds: OriginCertOutputs, news: OriginCertInputs): Promise<pulumi.dynamic.UpdateResult> {
        return await this.create(news);
    }

    private getHash() {
        const hash = crypto.createHash('sha1');
        return hash.update(`origin-cert-provider:${this.name}`).digest('hex');
    }
}

export class OriginCertResource extends BaseResource<OriginCertInputs, OriginCertOutputs> {
    declare readonly name: string;
    declare readonly certificate: pulumi.Output<string | undefined>;
    declare readonly expires_on: pulumi.Output<string | undefined>;
    declare readonly hostnames: pulumi.Output<string[]>;

    constructor(name: string, props: BaseOptions<OriginCertInputs>, opts?: pulumi.CustomResourceOptions) {
        super(
            new OriginCertProvider(name),
            `drunk:cloudflare:OriginCertProvider:${name}`,
            {id: undefined, certificate: undefined, expires_on: undefined, hostnames: [], ...props},
            opts,
        );
        this.name = name;
    }
}
