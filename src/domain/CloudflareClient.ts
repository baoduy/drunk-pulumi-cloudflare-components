import Cloudflare from 'cloudflare';
import {commonHelpers} from '../base';

export type EdgeCertType = {
    id: string;
    type: 'universal';
    hosts: string[];
    primary_certificate: string;
    status: 'active';
    certificates: [Record<string, any>];
    created_on: string;
    validity_days: number;
};

export type OriginCertType = {
    id: string;
    certificate: string;
    expires_on: string;
    hostnames: string[];
};

export class CfDomainClient {
    private _client: Cloudflare;
    private _zone: Cloudflare.Zones.Zone | undefined;

    constructor(private domain: string) {
        this._client = commonHelpers.getCloudflareClient();
    }

    public async getZone() {
        if (this._zone) return this._zone;
        const zones = await this._client.zones.list({match: 'any', name: this.domain});
        if (zones.result.length === 0) {
            throw new Error(`No zone found for domain ${this.domain}`);
        }
        return (this._zone = zones.result[0]);
    }

    public async getUniversalCerts(): Promise<EdgeCertType[]> {
        const zone = await this.getZone();
        const list = this._client.ssl.certificatePacks.list({zone_id: zone.id});
        const rs = new Array<EdgeCertType>();
        for await (const item of list) {
            rs.push(item as EdgeCertType);
        }
        return rs;
    }

    public async ensureUniversalCertEnabled() {
        const status = await this._client.ssl.universal.settings.get({zone_id: this._zone!.id});
        if (status.enabled) return;
        await this._client.ssl.universal.settings.edit({zone_id: this._zone!.id, enabled: true});
    }

    public async getMtlsClientCerts() {
        const zone = await this.getZone();
        const list = this._client.clientCertificates.list({zone_id: zone.id});

        const rs = new Array<OriginCertType>();
        for await (const item of list) {
            rs.push(item as OriginCertType);
        }
        return rs;
    }

    public async createMtlsClientCert(csr: string) {
        const zone = await this.getZone();
        return this._client.clientCertificates.create({zone_id: zone.id, validity_days: 10 * 365, csr});
    }

    public async getOriginCerts() {
        const zone = await this.getZone();
        const list = this._client.originCACertificates.list({zone_id: zone.id});

        const rs = new Array<OriginCertType>();
        for await (const item of list) {
            const cert = item as OriginCertType;
            if (cert.hostnames.filter((h) => h.includes(this.domain))) rs.push(item as OriginCertType);
        }
        return rs;
    }

    public async createOriginCerts(csr: string) {
        return this._client.originCACertificates.create({
            request_type: 'origin-rsa',
            requested_validity: 1095,
            csr,
            hostnames: [`*.${this.domain}`, this.domain, `www.${this.domain}`],
        });
    }
}
