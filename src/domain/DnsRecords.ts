import * as pulumi from '@pulumi/pulumi';
import {BaseOptions, BaseProvider, BaseResource} from '../base';

export interface DnsRecordInput {
    type: 'A' | 'AAAA' | 'CNAME' | 'TXT' | 'MX' | 'NS' | 'SRV' | 'CAA';
    name: string;
    content: string;
    ttl?: number;
    proxied?: boolean;
    priority?: number;
    comment?: string;
}

export interface DnsRecordsInputs {
    zoneId: string;
    records: DnsRecordInput[];
}

export interface DnsRecordOutput extends DnsRecordInput {
    id: string;
}

export interface DnsRecordsOutputs extends DnsRecordsInputs {
    recordIds: string[];
    createdRecords: DnsRecordOutput[];
}

const listDnsRecords = async (zoneId: string): Promise<any[]> => {
    const response = await fetch(`${process.env.CLOUDFLARE_API_BASE_PATH}/zones/${zoneId}/dns_records`, {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
            'Content-Type': 'application/json',
        },
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error listing DNS records: ${response.status} ${response.statusText}\nError: ${errorText}`);
    }

    return (await response.json()).result;
};

const buildDnsRecordBody = (record: DnsRecordInput) => ({
    type: record.type,
    name: record.name,
    content: record.content.split('/')[0],
    ttl: record.ttl || 100,
    proxied: record.proxied ?? false,
    priority: record.priority,
    comment: record.comment,
});

const upsertDnsRecord = async (zoneId: string, record: DnsRecordInput, recordId?: string): Promise<any> => {
    const method = recordId ? 'PUT' : 'POST';
    const url = recordId
        ? `${process.env.CLOUDFLARE_API_BASE_PATH}/zones/${zoneId}/dns_records/${recordId}`
        : `${process.env.CLOUDFLARE_API_BASE_PATH}/zones/${zoneId}/dns_records`;

    const response = await fetch(url, {
        method,
        headers: {
            Authorization: `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(buildDnsRecordBody(record)),
    });

    if (!response.ok) {
        const errorText = await response.text();
        const action = recordId ? 'updating' : 'creating';
        throw new Error(`Error ${action} DNS record: ${response.status} ${response.statusText}\nError: ${errorText}`);
    }

    const text = await response.text();
    //console.log(text);
    return text.trim() ? JSON.parse(text).result : text;
};

const deleteDnsRecord = async (zoneId: string, recordId: string): Promise<void> => {
    const response = await fetch(`${process.env.CLOUDFLARE_API_BASE_PATH}/zones/${zoneId}/dns_records/${recordId}`, {
        method: 'DELETE',
        headers: {
            Authorization: `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
            'Content-Type': 'application/json',
        },
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error deleting DNS record: ${response.status} ${response.statusText}\nError: ${errorText}`);
    }
};

class DnsRecordsProvider extends BaseProvider<DnsRecordsInputs, DnsRecordsOutputs> {
    constructor(private name: string) {
        super();
    }

    public async create(inputs: DnsRecordsInputs): Promise<pulumi.dynamic.CreateResult> {
        const existingRecords = await listDnsRecords(inputs.zoneId);
        const recordIds: string[] = [];

        for (const record of inputs.records) {
            // Check if record already exists (by name and type)
            const existing = existingRecords.find((r) => r.name.toLowerCase() === record.name.toLowerCase() && r.type.toLowerCase() === record.type.toLowerCase());

            // Upsert: create if not exists, update if exists
            const result = await upsertDnsRecord(inputs.zoneId, record, existing?.id);
            recordIds.push(result.id);
        }

        return {
            id: this.name,
            outs: {
                ...inputs,
                recordIds,
            },
        };
    }

    public async update(
        id: string,
        olds: DnsRecordsOutputs,
        news: DnsRecordsInputs,
    ): Promise<pulumi.dynamic.UpdateResult> {
        // Get the result from create (which handles upsert)
        const createResult = await this.create(news);

        // Track which records we're managing
        const managedRecordIds = new Set(olds.recordIds || []);
        const newRecordIds = new Set((createResult.outs as DnsRecordsOutputs).recordIds || []);

        // Delete records that are no longer in the input
        for (const recordId of managedRecordIds) {
            if (!newRecordIds.has(recordId)) {
                await deleteDnsRecord(news.zoneId, recordId);
            }
        }

        return {
            outs: createResult.outs,
        };
    }

    public async delete(id: string, props: DnsRecordsOutputs): Promise<void> {
        // Delete all managed records
        for (const recordId of props.recordIds || []) {
            try {
                await deleteDnsRecord(props.zoneId, recordId);
            } catch (error) {
                // Continue deleting other records even if one fails
                console.warn(`Failed to delete DNS record ${recordId}:`, error);
            }
        }
    }
}

export class DnsRecordsResource extends BaseResource<DnsRecordsInputs, DnsRecordsOutputs> {
    declare readonly name: string;
    public readonly recordIds!: pulumi.Output<string[]>;
    public readonly createdRecords!: pulumi.Output<DnsRecordOutput[]>;

    constructor(name: string, props: BaseOptions<DnsRecordsInputs>, opts?: pulumi.CustomResourceOptions) {
        super(new DnsRecordsProvider(name), `drunk:cloudflare:DnsRecords:${name}`, props, opts);
        this.name = name;
    }
}
