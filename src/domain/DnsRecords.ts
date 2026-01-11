import * as pulumi from '@pulumi/pulumi';
import { BaseOptions, BaseProvider, BaseResource } from '../base';
import { domainHelper } from '../helpers';

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
}

const listDnsRecords = async (zoneId: string): Promise<any[]> => {
  try {
    const rs = await domainHelper.request('dns_records', 'GET');
    return Array.isArray(rs) ? rs : [];
  } catch (error) {
    console.warn(`Failed to list DNS records for zone ${zoneId}:`, error);
    return [];
  }
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
  const path = recordId ? `dns_records/${recordId}` : `dns_records`;

  try {
    return await domainHelper.request(path, method, buildDnsRecordBody(record));
  } catch (error) {
    const action = recordId ? 'updating' : 'creating';
    throw new Error(`Error ${action} DNS record: ${error}`);
  }
};

const deleteDnsRecord = async (zoneId: string, recordId: string): Promise<void> => {
  try {
    await domainHelper.request(`dns_records/${recordId}`, 'DELETE');
  } catch (error) {
    throw new Error(`Error deleting DNS record: ${error}`);
  }
};

const normalizeName = (name: string): string => {
  return name.toLowerCase().replace(/\.$/, ''); // Remove trailing dot if present
};

const findExistingRecord = (records: any[], record: DnsRecordInput): any => {
  return records.find((r) => {
    // Normalize both names and extract subdomain (first part before the domain)
    const existingNameFull = normalizeName(r.name);
    const inputNameFull = normalizeName(record.name);

    // Extract subdomain part: split by '.' and take the first section
    const existingSubdomain = existingNameFull.split('.')[0];
    const inputSubdomain = inputNameFull.split('.')[0];

    return existingSubdomain === inputSubdomain && r.type.toUpperCase() === record.type.toUpperCase();
  });
};

const performUpsert = async (zoneId: string, record: DnsRecordInput, recordId?: string): Promise<any> => {
  try {
    return await upsertDnsRecord(zoneId, record, recordId);
  } catch (error: any) {
    //console.log(`[performUpsert] Error caught for ${record.name} (${record.type}): ${error.message}`);

    // If we get "identical record already exists" error, try to find and update it
    if (error.message?.includes('identical record already exists')) {
      const allRecords = await listDnsRecords(zoneId);
      const existingRecord = findExistingRecord(allRecords, record);

      if (existingRecord?.id) {
        return await upsertDnsRecord(zoneId, record, existingRecord.id);
      }
    }
    throw error;
  }
};

class DnsRecordsProvider extends BaseProvider<DnsRecordsInputs, DnsRecordsOutputs> {
  constructor(private name: string) {
    super();
  }

  public async create(inputs: DnsRecordsInputs): Promise<pulumi.dynamic.CreateResult> {
    const existingRecords = await listDnsRecords(inputs.zoneId);
    //console.log(`[DnsRecordsProvider:create] existingRecords for zone ${inputs.zoneId}:`, existingRecords);

    const recordIds: string[] = [];

    for (const record of inputs.records) {
      // Check if record already exists
      const existing = findExistingRecord(existingRecords, record);

      // Upsert: create if not exists, update if exists
      const result = await performUpsert(inputs.zoneId, record, existing?.id);
      if (result && result.id) {
        recordIds.push(result.id);
      }
    }

    return {
      id: inputs.zoneId,
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

  constructor(name: string, props: BaseOptions<DnsRecordsInputs>, opts?: pulumi.CustomResourceOptions) {
    super(new DnsRecordsProvider(name), `drunk:cloudflare:DnsRecords:${name}`, props, opts);
    this.name = name;
  }
}
