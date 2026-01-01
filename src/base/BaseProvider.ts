import * as pulumi from '@pulumi/pulumi';
import {isEqual} from 'lodash';

export type DeepInput<T> = T extends object
  ? { [K in keyof T]: DeepInput<T[K]> | pulumi.Input<T[K]> }
  : pulumi.Input<T>;

export type DeepOutput<T> = T extends object
  ? { [K in keyof T]: DeepOutput<T[K]> | pulumi.Output<T[K]> }
  : pulumi.Output<T>;

export type BaseOptions<TOptions> = DeepInput<TOptions>;
export type BaseOutputs<TOptions> = DeepOutput<TOptions>;

export abstract class BaseProvider<TInputs, TOutputs> implements pulumi.dynamic.ResourceProvider {
  public check? (olds: TInputs, news: TInputs) : Promise<pulumi.dynamic.CheckResult>

  public read? (id: string, props: TOutputs) : Promise<pulumi.dynamic.ReadResult<TOutputs>>;

  public delete?(id: string, props: TOutputs) : Promise<void>;

  public async update(id: string, olds: TOutputs, news: TInputs) : Promise<pulumi.dynamic.UpdateResult<TOutputs>>{
    return this.create(news);
  }

  public abstract create (inputs: TInputs) : Promise<pulumi.dynamic.CreateResult<TOutputs>>;

  public async diff (id: string, previousOutput: TOutputs, news: TInputs) : Promise<pulumi.dynamic.DiffResult>{
    return { changes: !isEqual(previousOutput, news) };
  }
}

export abstract class BaseResource<TInputs, TOutputs> extends pulumi.dynamic.Resource {
  protected constructor(
    provider: BaseProvider<TInputs, TOutputs>,
    name: string,
    args: BaseOptions<TInputs & Partial<TOutputs>>,
    opts?: pulumi.CustomResourceOptions,
  ) {
    super(provider, name, args, opts);
  }
}
