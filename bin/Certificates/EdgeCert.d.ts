import * as pulumi from '@pulumi/pulumi';
import { BaseOptions, BaseResource } from '../Bases';
export interface EdgeCertInputs {
    domain: string;
}
export interface EdgeCertOutputs {
}
export declare class EdgeCertResource extends BaseResource<EdgeCertInputs, EdgeCertOutputs> {
    readonly name: string;
    constructor(name: string, props: BaseOptions<EdgeCertInputs>, opts?: pulumi.CustomResourceOptions);
}
