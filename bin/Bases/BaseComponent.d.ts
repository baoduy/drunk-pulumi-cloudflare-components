import * as pulumi from '@pulumi/pulumi';
export declare function getComponentResourceType(type: string): string;
/**
 * BaseComponent serves as an abstract foundation class for Pulumi resource components.
 * It provides core functionality and structure for creating custom infrastructure components.
 *
 * @template TArgs - Generic type parameter extending pulumi.Inputs to define component arguments
 * @extends pulumi.ComponentResource<TArgs>
 */
/**
 * @template TArgs - Generic type parameter extending pulumi.Inputs
 * @example
 * // Add usage example here
 * const component = new MyComponent('name', args);
 */
export declare abstract class BaseComponent<TArgs extends pulumi.Inputs> extends pulumi.ComponentResource<TArgs> {
    readonly name: string;
    protected readonly args: TArgs;
    protected readonly opts?: pulumi.ComponentResourceOptions | undefined;
    /**
     * Creates a new instance of BaseComponent
     * @param type - The resource type identifier for this component
     * @param name - Unique name for this component instance
     * @param args - Configuration arguments for this component
     * @param opts - Optional Pulumi resource options to control component behavior
     */
    constructor(type: string, name: string, args: TArgs, opts?: pulumi.ComponentResourceOptions | undefined);
    /**
     * Registers component outputs with the Pulumi engine.
     * This method should be overridden by derived classes to ensure proper output registration.
     * @param outputs - The outputs to register for this component
     */
    protected registerOutputs(): void;
    /**
     * Abstract method that must be implemented by derived classes to expose component outputs.
     * This method should return all relevant outputs that consumers of the component might need.
     * @returns An object containing the component's outputs, either as direct values or Pulumi outputs
     */
    abstract getOutputs(): pulumi.Inputs | pulumi.Output<pulumi.Inputs>;
}
