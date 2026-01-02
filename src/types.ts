import * as pulumi from '@pulumi/pulumi';

export type DnsRecordTypes = 'A' | 'AAAA' | 'CNAME' | 'MX' | 'NS' | 'PTR' | 'SOA' | 'SRV' | 'TXT' | 'CAA';

export type CommonProps =
  | 'rsGroup'
  | 'groupRoles'
  | 'vaultInfo'
  | 'resourceGroupName'
  | 'location'
  | 'resourceName'
  | 'tags';

type AsInput<T> = {
  [K in keyof T]: T[K] extends object
    ? T[K] extends Array<any>
      ? pulumi.Input<NonNullable<T[K]>>
      : AsInput<NonNullable<T[K]>>
    : pulumi.Input<NonNullable<T[K]>>;
};

type AsOutput<T> = {
  [K in keyof T]: T[K] extends object
    ? T[K] extends Array<any>
      ? pulumi.Output<NonNullable<T[K]>>
      : AsOutput<NonNullable<T[K]>>
    : pulumi.Output<NonNullable<T[K]>>;
};

export type WithName = {
  /** The options customize the resource name. If not provided the default name from parent will be used. */
  name?: string;
};

export type ResourceType = {
  resourceName: string;
  id: string;
};

export type WithVaultInfo = {
  vaultInfo?: ResourceInputs;
};

export type ResourceInputs = AsInput<ResourceType>;
export type ResourceOutputs = AsOutput<ResourceType>;
