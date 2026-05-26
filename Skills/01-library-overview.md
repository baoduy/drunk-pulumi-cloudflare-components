# Drunk Pulumi Cloudflare Components - Library Overview

## Purpose
This skill provides an overview of the drunk-pulumi-cloudflare-components library architecture, conventions, and usage patterns. Use this when creating or modifying any component in the library.

## Library Architecture

### Component Hierarchy
All components extend from `BaseComponent<TArgs>` which provides:
- Automatic resource type registration with `drunk:cloudflare:` prefix
- Built-in access to Cloudflare account ID and zone ID from environment variables
- Abstract `getOutputs()` method for component outputs
- Automatic output registration via `registerOutputs()`

### Base Provider Pattern
Dynamic providers extend from `BaseProvider<TInputs, TOutputs>` for resources requiring custom CRUD operations:
- Use when Pulumi's native Cloudflare provider doesn't support a feature
- Implement `create`, `update`, `delete`, and optionally `diff` methods
- Wrap providers in `BaseResource` for declarative Pulumi resource interface

### Directory Structure
```
src/
  base/              # Base classes (BaseComponent, BaseProvider)
  cidr-tools/        # CIDR and IP address utilities
  domain/            # DNS records, certificates, Cloudflare client
  helpers/           # API helpers (accountHelper, domainHelper)
  services/          # Turnstile, Firewall rules
  zeroTrust/         # Zero Trust applications, policies, device settings
  types.ts           # Shared TypeScript types
  index.ts           # Main entry point with exports
```

## Key Patterns

### Component Resource Type
Always use the helper to register component types:
```typescript
super('ComponentName', name, args, opts);
// Automatically becomes: drunk:cloudflare:ComponentName
```

### Environment Variables
The library expects these environment variables:
- `CLOUDFLARE_API_TOKEN` - API token for Cloudflare API
- `CLOUDFLARE_ACCOUNT_ID` - Cloudflare account ID
- `CLOUDFLARE_ZONE_ID` - Cloudflare zone ID (for domain operations)

Access via:
```typescript
this.accountId  // pulumi.Output<string>
this.zoneId     // pulumi.Output<string>
```

### Component Constructor Pattern
```typescript
constructor(name: string, args: TArgs, opts?: pulumi.ComponentResourceOptions) {
    super('ComponentType', name, args, opts);
    // Create resources
    this.registerOutputs();
}
```

### Outputs Pattern
Always implement `getOutputs()` to return component outputs:
```typescript
public getOutputs(): pulumi.Inputs | pulumi.Output<pulumi.Inputs> {
    return {
        id: this.resource.id,
        name: this.resource.name,
    };
}
```

## Integration Points

### Azure Components Integration
The library integrates with `@drunk-pulumi/azure-components` for:
- Azure AD identity provider configuration
- App registrations for SSO
- Key Vault secret storage
- Role-based access control

### Zero Trust Integration
Main orchestration via `CloudflareZeroTrustAccount` which manages:
- Zero Trust organization setup
- Azure AD SSO integration
- Device enrollment and posture policies
- Tunnel creation with virtual networks
- Gateway certificate management

## TypeScript Conventions

### Type Safety
- Always use explicit types for arguments (interfaces extending types.ts)
- Use `pulumi.Input<T>` for values that can be promises or outputs
- Use `pulumi.Output<T>` for component outputs
- Leverage TypeScript strict mode (enabled in tsconfig.json)

### Naming Conventions
- Component classes: PascalCase (e.g., `ZeroTrustApplication`)
- Component files: PascalCase matching class name
- Arguments interfaces: `{ComponentName}Args`
- Outputs interfaces: `{ComponentName}Outputs` (for providers)
- Private methods: camelCase with descriptive names

### Import Patterns
```typescript
import * as pulumi from '@pulumi/pulumi';
import * as cf from '@pulumi/cloudflare';
import {BaseComponent} from '../base';
import * as types from '../types';
```

## Development Workflow

### Build Commands
- `pnpm run build` - Full build with tsconfig update and package copy
- `pnpm run fastBuild` - TypeScript compilation only
- `npx tsc --noEmit` - Type checking without output
- `pnpm run docs` - Generate documentation

### Testing
- Place tests in `__tests__/` directory (currently not implemented)
- Test examples in `pulumi-test/` directory
- Validate TypeScript in pulumi-test: `cd pulumi-test && npx tsc --noEmit`

### Version Control
- `bin/` directory is git-ignored (build output)
- Build artifacts are generated during CI/CD
- Never commit compiled JavaScript files

## Best Practices

1. **Minimal Dependencies**: Keep resource dependencies explicit and minimal
2. **Parent Relationships**: Set `parent: this` for child resources
3. **Resource Options**: Pass through `opts` and extend when needed
4. **Secret Handling**: Use `pulumi.secret()` for sensitive values
5. **Error Handling**: Validate inputs early, provide clear error messages
6. **Documentation**: Add JSDoc comments for public APIs
7. **Outputs**: Only expose necessary outputs to reduce complexity

## Common Pitfalls

1. **Missing Parent**: Always set parent for child resources to maintain hierarchy
2. **Circular Dependencies**: Avoid circular imports between modules
3. **Promise Handling**: Use `pulumi.output()` when working with promises
4. **Type Mismatches**: Ensure Input types match between components
5. **Environment Variables**: Don't hardcode values, use helpers module

## Package Structure

### Dependencies
- **@pulumi/cloudflare**: Official Cloudflare provider
- **@pulumi/pulumi**: Core Pulumi SDK
- **@drunk-pulumi/azure-components**: Azure integration (optional)
- **cloudflare**: Cloudflare SDK for API calls
- **lodash**: Utility functions

### Build Output
The `pnpm run build` process:
1. Updates tsconfig.json with all TypeScript files
2. Compiles TypeScript to JavaScript in `bin/`
3. Copies package.json (without devDependencies)
4. Copies README.md and PulumiPlugin.yaml

### Package Distribution
Published to npm as `@drunk-pulumi/cloudflare-components` for team consumption.
