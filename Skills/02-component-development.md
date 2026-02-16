# Component Development Guide

## Purpose
This skill guides you through creating new Pulumi components for the drunk-pulumi-cloudflare-components library. Use this when adding new Cloudflare resource abstractions.

## Component Types

### 1. Simple Component (extends BaseComponent)
Use when wrapping existing Cloudflare resources with additional logic.

**Template:**
```typescript
import * as pulumi from '@pulumi/pulumi';
import * as cf from '@pulumi/cloudflare';
import {BaseComponent} from './base';
import * as types from './types';

export interface MyComponentArgs {
    name: string;
    // Add component-specific arguments
    config?: Partial<cf.SomeCloudflareResourceArgs>;
}

export class MyComponent extends BaseComponent<MyComponentArgs> {
    public readonly resourceId: pulumi.Output<string>;
    private readonly resource: cf.SomeCloudflareResource;

    constructor(name: string, args: MyComponentArgs, opts?: pulumi.ComponentResourceOptions) {
        super('MyComponent', name, args, opts);
        
        this.resource = this.createResource();
        this.resourceId = this.resource.id;
        
        this.registerOutputs();
    }

    public getOutputs(): pulumi.Inputs | pulumi.Output<pulumi.Inputs> {
        return {
            resourceId: this.resourceId,
        };
    }

    private createResource(): cf.SomeCloudflareResource {
        const {name, config} = this.args;
        
        return new cf.SomeCloudflareResource(`${this.name}-resource`, {
            accountId: this.accountId,
            name,
            ...config,
        }, {
            parent: this,
        });
    }
}
```

### 2. Dynamic Provider Component
Use when the Cloudflare Pulumi provider doesn't support the resource or you need custom lifecycle logic.

**Template:**
```typescript
import * as pulumi from '@pulumi/pulumi';
import {BaseOptions, BaseProvider, BaseResource, commonHelpers} from './base';
import Cloudflare from 'cloudflare';

// Define inputs and outputs
export interface MyResourceInputs {
    name: string;
    accountId?: string;
    config: {
        // Configuration properties
    };
}

export interface MyResourceOutputs {
    id: string;
    name: string;
    // Other outputs
}

// Create the provider
class MyResourceProvider extends BaseProvider<MyResourceInputs, MyResourceOutputs> {
    constructor(private name: string) {
        super();
    }

    public async create(inputs: MyResourceInputs): Promise<pulumi.dynamic.CreateResult> {
        const client = commonHelpers.getCloudflareClient();
        const account_id = inputs.accountId ?? commonHelpers.cloudflareAccountId;

        // Make API call to create resource
        const result = await client.someApi.create({
            account_id,
            name: inputs.name,
            ...inputs.config,
        });

        return {
            id: result.id,
            outs: {
                id: result.id,
                name: result.name,
            },
        };
    }

    public async update(
        id: string, 
        olds: MyResourceOutputs, 
        news: MyResourceInputs
    ): Promise<pulumi.dynamic.UpdateResult> {
        const client = commonHelpers.getCloudflareClient();
        const account_id = news.accountId ?? commonHelpers.cloudflareAccountId;

        const result = await client.someApi.update(id, {
            account_id,
            name: news.name,
            ...news.config,
        });

        return {
            outs: {
                id: result.id,
                name: result.name,
            },
        };
    }

    public async delete(id: string, props: MyResourceOutputs): Promise<void> {
        const client = commonHelpers.getCloudflareClient();
        await client.someApi.delete(id);
    }

    // Optional: implement diff for better update detection
    public async diff(
        id: string, 
        olds: MyResourceOutputs, 
        news: MyResourceInputs
    ): Promise<pulumi.dynamic.DiffResult> {
        const replaces: string[] = [];
        const changes = olds.name !== news.name;
        
        return {
            changes,
            replaces,
        };
    }
}

// Create the resource wrapper
export class MyResource extends BaseResource<MyResourceInputs, MyResourceOutputs> {
    constructor(name: string, args: MyResourceInputs, opts?: BaseOptions) {
        super(new MyResourceProvider(name), name, args, opts);
    }
}
```

### 3. Composite Component
Use when combining multiple resources into a cohesive unit.

**Pattern:**
```typescript
export class CompositeComponent extends BaseComponent<CompositeArgs> {
    public readonly mainResource: cf.MainResource;
    public readonly relatedResource: cf.RelatedResource;

    constructor(name: string, args: CompositeArgs, opts?: pulumi.ComponentResourceOptions) {
        super('CompositeComponent', name, args, opts);
        
        // Create resources in dependency order
        this.mainResource = this.createMainResource();
        this.relatedResource = this.createRelatedResource(this.mainResource);
        
        this.registerOutputs();
    }

    private createMainResource(): cf.MainResource {
        return new cf.MainResource(`${this.name}-main`, {
            // config
        }, {
            parent: this,
        });
    }

    private createRelatedResource(main: cf.MainResource): cf.RelatedResource {
        return new cf.RelatedResource(`${this.name}-related`, {
            mainId: main.id,
            // other config
        }, {
            parent: this,
            dependsOn: [main],
        });
    }

    public getOutputs(): pulumi.Inputs | pulumi.Output<pulumi.Inputs> {
        return {
            mainId: this.mainResource.id,
            relatedId: this.relatedResource.id,
        };
    }
}
```

## Component Development Checklist

### Planning Phase
- [ ] Identify the Cloudflare resource or abstraction needed
- [ ] Check if native Pulumi Cloudflare provider supports it
- [ ] Determine component type (Simple, Dynamic, or Composite)
- [ ] Define input arguments interface
- [ ] Define output properties

### Implementation Phase
- [ ] Create component file in appropriate directory
- [ ] Extend BaseComponent or create BaseProvider
- [ ] Implement constructor with super() call
- [ ] Create private helper methods for resource creation
- [ ] Implement getOutputs() method
- [ ] Call registerOutputs() at end of constructor
- [ ] Add proper TypeScript types and interfaces
- [ ] Set parent: this for all child resources

### Testing Phase
- [ ] Build the library: `pnpm run build`
- [ ] Check TypeScript compilation: `npx tsc --noEmit`
- [ ] Create test example in `pulumi-test/`
- [ ] Validate example compiles: `cd pulumi-test && npx tsc --noEmit`
- [ ] Test actual deployment (if possible)

### Documentation Phase
- [ ] Add JSDoc comments to public class and methods
- [ ] Document all interface properties
- [ ] Add usage example in JSDoc
- [ ] Update DOCUMENTATION.md if comprehensive docs exist
- [ ] Export component from appropriate index.ts

## Input Arguments Design

### Required vs Optional
```typescript
export interface MyComponentArgs {
    // Required: no default value, essential for component
    name: string;
    targetId: pulumi.Input<string>;
    
    // Optional: has default or can be omitted
    enabled?: boolean;
    config?: Partial<cf.ConfigType>;
    tags?: Record<string, string>;
}
```

### Pulumi Input Types
Use `pulumi.Input<T>` for values that might be outputs from other resources:
```typescript
export interface MyComponentArgs {
    // Can accept: string, Promise<string>, or Output<string>
    tunnelId: pulumi.Input<string>;
    
    // Array of inputs
    policyIds?: pulumi.Input<string>[];
    
    // Input of array
    domains: pulumi.Input<string[]>;
}
```

### Nested Configuration
Leverage TypeScript utility types for cleaner interfaces:
```typescript
export interface MyComponentArgs {
    // Omit fields that component will set automatically
    config?: Partial<Omit<cf.ResourceArgs, 'accountId' | 'zoneId'>>;
    
    // Pick only specific fields
    settings?: Pick<cf.SettingsArgs, 'enabled' | 'mode'>;
    
    // Extend with custom fields
    advanced?: Partial<cf.AdvancedArgs> & {
        customField: string;
    };
}
```

## Resource Options Management

### Passing Through Options
Always pass through and extend resource options:
```typescript
constructor(name: string, args: MyComponentArgs, opts?: pulumi.ComponentResourceOptions) {
    super('MyComponent', name, args, opts);
    
    // For child resources, extend opts
    new cf.Resource(`${name}-child`, {
        // config
    }, {
        parent: this,        // Always set parent
        ...opts,             // Pass through options
        dependsOn: [...(opts?.dependsOn || []), otherResource],
    });
}
```

### Common Options
- **parent**: Always set to `this` for proper hierarchy
- **dependsOn**: Explicit dependencies beyond implicit ones
- **protect**: Prevent accidental deletion
- **ignoreChanges**: Ignore changes to specific properties
- **deleteBeforeReplace**: Control replacement order
- **provider**: Use specific provider instance

## API Integration Patterns

### Using Cloudflare SDK
```typescript
import Cloudflare from 'cloudflare';
import {commonHelpers} from './helpers';

// Get configured client
const client = commonHelpers.getCloudflareClient();

// Make API calls
const result = await client.someApi.create({
    account_id: commonHelpers.cloudflareAccountId,
    // other params
});
```

### Using Account Helper
```typescript
import {accountHelper} from './helpers';

// Make authenticated account-level API call
const result = await accountHelper('/some/path', 'POST', {
    // request body
});
```

### Using Domain Helper
```typescript
import {domainHelper} from './helpers';

// Make authenticated zone-level API call
const result = await domainHelper('/dns_records', 'POST', {
    type: 'CNAME',
    name: 'subdomain',
    content: 'target.example.com',
});
```

## Error Handling

### Input Validation
```typescript
constructor(name: string, args: MyComponentArgs, opts?: pulumi.ComponentResourceOptions) {
    super('MyComponent', name, args, opts);
    
    // Validate required fields
    if (!args.targetId) {
        throw new Error('targetId is required');
    }
    
    // Validate logic constraints
    if (args.publicRoutes && args.publicRoutes.length === 0) {
        throw new Error('publicRoutes must contain at least one route');
    }
    
    this.registerOutputs();
}
```

### API Error Handling
```typescript
public async create(inputs: MyInputs): Promise<pulumi.dynamic.CreateResult> {
    try {
        const client = commonHelpers.getCloudflareClient();
        const result = await client.someApi.create(inputs.config);
        return { id: result.id, outs: { ...result } };
    } catch (error) {
        throw new Error(`Failed to create resource: ${error.message}`);
    }
}
```

## Testing Components

### Example Test Structure (pulumi-test/)
```typescript
import * as pulumi from '@pulumi/pulumi';
import * as cf from '@drunk-pulumi/cloudflare-components';

// Test your component
const myComponent = new cf.MyComponent('test-component', {
    name: 'test',
    config: {
        // test config
    },
});

// Export outputs for verification
export const componentId = myComponent.resourceId;
```

### Validation Steps
1. Run `npx tsc --noEmit` to check types
2. Run `pulumi preview` to check resource plan
3. Run `pulumi up` to deploy (if safe)
4. Run `pulumi destroy` to clean up

## Component Export Pattern

### Update index.ts
```typescript
// Add to appropriate section
export * from './MyComponent';

// Or with namespace
export * as myNamespace from './myDirectory';
```

### Verify Exports
```typescript
// Should be accessible as:
import {MyComponent} from '@drunk-pulumi/cloudflare-components';
// or
import * as cf from '@drunk-pulumi/cloudflare-components';
const comp = new cf.MyComponent(...);
```

## Best Practices Summary

1. **Always extend BaseComponent** for standard components
2. **Use BaseProvider + BaseResource** for dynamic resources
3. **Set parent: this** for all child resources
4. **Implement getOutputs()** to expose component outputs
5. **Call registerOutputs()** at end of constructor
6. **Use pulumi.Input<T>** for flexible input types
7. **Validate inputs early** in constructor
8. **Pass through opts** and extend as needed
9. **Use helper functions** for API calls
10. **Export from index.ts** for public API
11. **Add JSDoc comments** for documentation
12. **Test in pulumi-test/** before committing
