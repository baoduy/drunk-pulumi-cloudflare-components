import * as pulumi from '@pulumi/pulumi';
import { BaseOptions, BaseProvider, BaseResource } from '../Bases';

export interface EdgeCertInputs {
  domain: string;
}

export interface EdgeCertOutputs {}

class EdgeCertProvider implements BaseProvider<EdgeCertInputs, EdgeCertOutputs> {
  constructor(private name: string) {}

  async create(inputs: EdgeCertInputs): Promise<pulumi.dynamic.CreateResult> {
    // Implementation for creating an Edge Certificate
    return { id: this.name, outs: {} };
  }
}

export class EdgeCertResource extends BaseResource<EdgeCertInputs, EdgeCertOutputs> {
  public readonly name: string;

  constructor(name: string, props: BaseOptions<EdgeCertInputs>, opts?: pulumi.CustomResourceOptions) {
    super(new EdgeCertProvider(name), `drunk-pulumi:custom:EdgeCertProvider:${name}`, props, opts);
    this.name = name;
  }
}
