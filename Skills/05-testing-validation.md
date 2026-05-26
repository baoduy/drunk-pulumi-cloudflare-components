# Testing and Validation

## Purpose
This skill provides comprehensive guidance for testing and validating components in the drunk-pulumi-cloudflare-components library. Use this when developing new features, debugging issues, or ensuring code quality.

## Testing Strategy

### Testing Hierarchy
1. **TypeScript Compilation** - Fastest feedback, catches type errors
2. **Unit Tests** - Test individual component logic (future enhancement)
3. **Integration Tests** - Test in pulumi-test directory
4. **Deployment Tests** - Test actual Cloudflare resource creation
5. **Manual Validation** - Verify behavior in Cloudflare dashboard

## TypeScript Validation

### Type Checking Without Build
```bash
npx tsc --noEmit
```

**When to Use:**
- Before committing code
- During development to catch type errors
- In CI/CD pipeline
- Quick validation after changes

**What It Checks:**
- Type correctness
- Interface compliance
- Generic constraints
- Import/export validity
- TypeScript strict mode rules

### Common Type Errors and Fixes

**Error: Property does not exist**
```typescript
// ❌ Wrong
interface MyArgs {
    name: string;
}
const args: MyArgs = { name: 'test', extra: 'field' };

// ✅ Correct
interface MyArgs {
    name: string;
    extra?: string;  // Make it optional
}
```

**Error: Type is not assignable**
```typescript
// ❌ Wrong
public readonly id: string;
constructor() {
    this.id = resource.id;  // resource.id is Output<string>
}

// ✅ Correct
public readonly id: pulumi.Output<string>;
constructor() {
    this.id = resource.id;
}
```

**Error: Cannot find module**
```typescript
// ❌ Wrong
import {Something} from './helpers';  // Wrong path

// ✅ Correct
import {Something} from '../helpers';
import * as helpers from './helpers';
```

## Build Validation

### Full Build
```bash
pnpm run build
```

**Build Steps:**
1. Update tsconfig.json with all TypeScript files
2. Compile TypeScript to JavaScript
3. Generate .d.ts declaration files
4. Copy package.json, README.md, PulumiPlugin.yaml to bin/

**Build Output:**
- `bin/` directory with compiled JavaScript
- Type declarations for TypeScript consumers
- Package files for npm distribution

### Fast Build (Development)
```bash
pnpm run fastBuild
```

**When to Use:**
- During rapid development
- When you only need type checking
- When package files haven't changed

**What It Skips:**
- tsconfig.json update
- Package file copying

### Validate Build Output
```bash
# Check bin directory
ls -la bin/

# Verify main entry point
cat bin/index.js | head -20

# Check type declarations
cat bin/index.d.ts | head -20

# Verify package.json
cat bin/package.json
```

## Integration Testing (pulumi-test/)

### Setup Test Environment
```bash
cd pulumi-test
npm install
```

### Test Structure
```
pulumi-test/
  samples/          # Example component usage
  index.ts          # Main test file
  package.json      # Test dependencies
  tsconfig.json     # Test TypeScript config
  Pulumi.yaml       # Pulumi project config
```

### Creating Test Files

**Basic Component Test:**
```typescript
// pulumi-test/samples/test-dns.ts
import * as pulumi from '@pulumi/pulumi';
import * as cf from '@drunk-pulumi/cloudflare-components';

const config = new pulumi.Config();
const zoneId = config.require('zoneId');

// Test DNS records component
const dnsRecords = new cf.domain.DnsRecordsResource('test-dns', {
    zoneId: zoneId,
    records: [{
        subdomain: 'test',
        type: 'CNAME',
        content: 'example.com',
        proxied: true,
        ttl: 1,
    }],
});

// Export for verification
export const recordIds = dnsRecords.recordIds;
```

**Zero Trust Test:**
```typescript
// pulumi-test/samples/test-zero-trust.ts
import * as pulumi from '@pulumi/pulumi';
import * as cf from '@drunk-pulumi/cloudflare-components';

const config = new pulumi.Config();

const zeroTrust = new cf.CloudflareZeroTrustAccount('test-zt', {
    organization: {
        name: 'Test Organization',
    },
    enableAzIdentity: false,  // Disable for simple test
    tunnels: [{
        name: 'test-tunnel',
        anonymousRoutes: [{
            fqdn: 'test.example.com',
            service: 'http://localhost:8080',
        }],
    }],
});

export const organizationId = zeroTrust.organization?.id;
```

### Validate Test Files
```bash
cd pulumi-test
npx tsc --noEmit
```

**Expected Output:**
```
# No output = success
# Errors = fix type issues
```

### Pulumi Commands

**Preview (Dry Run):**
```bash
cd pulumi-test
pulumi preview

# With specific target
pulumi preview --target 'urn:pulumi:dev::test::drunk:cloudflare:DnsRecords::test-dns'
```

**Deploy (Requires Credentials):**
```bash
cd pulumi-test
pulumi up

# Non-interactive
pulumi up --yes

# With detailed logs
pulumi up --logtostderr -v=9 2> logs.txt
```

**Destroy:**
```bash
cd pulumi-test
pulumi destroy

# Non-interactive
pulumi destroy --yes
```

**Stack Operations:**
```bash
# List stacks
pulumi stack ls

# Select stack
pulumi stack select dev

# View stack outputs
pulumi stack output

# Export stack state
pulumi stack export --file stack.json
```

## Test-Driven Development Pattern

### 1. Define Expected Behavior
```typescript
// Define what the component should do
// Example: DnsRecordsResource should create multiple records

const expected = {
    records: [
        { subdomain: 'www', type: 'CNAME' },
        { subdomain: 'api', type: 'CNAME' },
    ],
};
```

### 2. Create Test Case
```typescript
// pulumi-test/samples/test-multi-dns.ts
import * as cf from '@drunk-pulumi/cloudflare-components';

const dnsRecords = new cf.domain.DnsRecordsResource('multi-dns', {
    zoneId: zoneId,
    records: [
        { subdomain: 'www', type: 'CNAME', content: 'example.com', proxied: true },
        { subdomain: 'api', type: 'CNAME', content: 'api-server.com', proxied: true },
    ],
});

export const recordIds = dnsRecords.recordIds;
```

### 3. Implement Component
```typescript
// src/domain/DnsRecords.ts
export class DnsRecordsResource extends BaseResource<DnsRecordsInputs, DnsRecordsOutputs> {
    // Implementation
}
```

### 4. Validate
```bash
# Type check
npx tsc --noEmit

# Build
pnpm run build

# Test
cd pulumi-test && npx tsc --noEmit

# Preview
cd pulumi-test && pulumi preview
```

### 5. Iterate
- Fix type errors
- Adjust implementation
- Re-validate

## Manual Validation

### Component Output Verification
```typescript
// Export all important outputs
export const outputs = {
    dnsRecordIds: dnsRecords.recordIds,
    tunnelId: zeroTrust.tunnels?.['main'].id,
    organizationId: zeroTrust.organization?.id,
};
```

**Check Outputs:**
```bash
cd pulumi-test
pulumi stack output

# Specific output
pulumi stack output dnsRecordIds
```

### Cloudflare Dashboard Checks

**DNS Records:**
1. Navigate to DNS section in Cloudflare dashboard
2. Verify records were created
3. Check proxy status (orange cloud)
4. Verify TTL values
5. Confirm content is correct

**Zero Trust:**
1. Go to Zero Trust dashboard
2. Check Access > Applications
3. Verify tunnels in Networks > Tunnels
4. Review policies in Access > Policies
5. Check device settings in My Team > Devices

**Certificates:**
1. SSL/TLS > Origin Server
2. Verify certificates were created
3. Check hostnames covered
4. Verify expiration dates

## Error Detection

### Common Build Errors

**Missing Export:**
```typescript
// ❌ Component not exported
export class MyComponent extends BaseComponent<MyArgs> {}

// ✅ Export from index.ts
// src/index.ts
export * from './MyComponent';
```

**Circular Dependency:**
```typescript
// ❌ Circular import
// fileA.ts imports fileB.ts
// fileB.ts imports fileA.ts

// ✅ Extract shared code to separate file
// shared.ts contains common types
// fileA.ts imports shared.ts
// fileB.ts imports shared.ts
```

**Type Import Issues:**
```typescript
// ❌ Wrong
import MyType from './types';

// ✅ Correct
import {MyType} from './types';
import * as types from './types';
```

### Runtime Errors

**Environment Variables:**
```typescript
// Check before using
if (!process.env.CLOUDFLARE_API_TOKEN) {
    throw new Error('CLOUDFLARE_API_TOKEN environment variable is required');
}
```

**API Errors:**
```typescript
try {
    const result = await client.someApi.create(params);
} catch (error) {
    throw new Error(`Failed to create resource: ${error.message}`);
}
```

**Resource Dependencies:**
```typescript
// Ensure proper dependencies
const resource2 = new Resource2('res2', {
    dependsOn: resource1.id,
}, {
    dependsOn: [resource1],  // Explicit dependency
});
```

## Validation Checklist

### Pre-Commit Checks
- [ ] Run `npx tsc --noEmit` - passes without errors
- [ ] Run `pnpm run build` - completes successfully
- [ ] Check `bin/` directory - contains expected files
- [ ] Verify exports in `src/index.ts` - component is exported
- [ ] Review code for sensitive data - no secrets committed

### Component Development Checks
- [ ] Extends BaseComponent or uses BaseProvider
- [ ] Constructor calls `super()` correctly
- [ ] Implements `getOutputs()` method
- [ ] Calls `registerOutputs()` at end of constructor
- [ ] Sets `parent: this` for child resources
- [ ] Uses proper TypeScript types
- [ ] Passes through resource options
- [ ] Validates input arguments
- [ ] Handles errors appropriately

### Integration Test Checks
- [ ] Test file compiles: `cd pulumi-test && npx tsc --noEmit`
- [ ] Pulumi preview runs: `pulumi preview`
- [ ] Expected resources are planned
- [ ] No unexpected changes or replacements
- [ ] Outputs are defined and accessible
- [ ] Test cleanup works: `pulumi destroy`

### Documentation Checks
- [ ] JSDoc comments on public classes
- [ ] JSDoc comments on public methods
- [ ] Interface properties documented
- [ ] Usage example provided
- [ ] Updated DOCUMENTATION.md (if applicable)
- [ ] README.md updated (if needed)

## Debugging Techniques

### Enable Verbose Logging
```bash
# Pulumi verbose logging
export PULUMI_LOG_LEVEL=debug
pulumi preview

# TypeScript compiler verbose
tsc --noEmit --listFiles

# npm/pnpm verbose
pnpm install --verbose
```

### Inspect Generated Code
```bash
# View compiled JavaScript
cat bin/MyComponent.js

# View type declarations
cat bin/MyComponent.d.ts

# Check source maps
cat bin/MyComponent.js.map
```

### Debug Pulumi Resources
```typescript
// Add debug outputs
export const debugOutputs = {
    accountId: pulumi.secret(accountId),
    zoneId: pulumi.secret(zoneId),
    tunnelId: tunnel.id,
    resourceUrn: tunnel.urn,
};
```

### Use Pulumi Console
```bash
# View in Pulumi Console
pulumi stack output --show-secrets

# Export state
pulumi stack export > state.json

# Compare states
pulumi stack export > state-after.json
diff state-before.json state-after.json
```

## Testing Best Practices

1. **Test Incrementally**: Test each component as you develop
2. **Use Type Checking**: Run `tsc --noEmit` frequently
3. **Test in Isolation**: Create simple test cases for each component
4. **Validate Outputs**: Export and verify component outputs
5. **Check Dashboard**: Manually verify resources in Cloudflare
6. **Clean Up**: Always destroy test resources
7. **Version Control**: Commit working code frequently
8. **Document Tests**: Add comments explaining test purpose
9. **Test Edge Cases**: Try invalid inputs, missing fields
10. **Test Dependencies**: Verify resource dependencies work

## Continuous Integration

### GitHub Actions Pattern
```yaml
name: Build and Test

on: [push, pull_request]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Install pnpm
        run: npm install -g pnpm
      
      - name: Install dependencies
        run: pnpm install
      
      - name: Type check
        run: npx tsc --noEmit
      
      - name: Build
        run: pnpm run build
      
      - name: Test examples
        run: |
          cd pulumi-test
          npm install
          npx tsc --noEmit
```

## Performance Testing

### Build Performance
```bash
# Time the build
time pnpm run build

# Memory usage
/usr/bin/time -v pnpm run build
```

### Component Performance
```bash
# Time Pulumi operations
time pulumi preview
time pulumi up
time pulumi destroy
```

## Regression Testing

### Baseline Test
```bash
# Create baseline state
pulumi up
pulumi stack export > baseline-state.json
```

### After Changes
```bash
# Test changes
pnpm run build
cd pulumi-test
pulumi preview

# Should show no changes if components are stable
# Changes should only be expected changes
```

### State Comparison
```bash
# Export current state
pulumi stack export > current-state.json

# Compare
diff baseline-state.json current-state.json
```

## Test Data Management

### Test Configuration
```yaml
# Pulumi.dev.yaml
config:
  cloudflare-components:zoneId: "test-zone-id"
  cloudflare-components:accountId: "test-account-id"
  cloudflare-components:environment: "development"
```

### Separate Test/Prod
```bash
# Development stack
pulumi stack select dev
pulumi config set zoneId "dev-zone-id"

# Production stack  
pulumi stack select prod
pulumi config set zoneId "prod-zone-id"
```

## Troubleshooting Guide

**Problem: Build fails with type errors**
- Solution: Run `npx tsc --noEmit` to see exact errors
- Fix type mismatches, missing imports
- Verify TypeScript version compatibility

**Problem: Test file won't compile**
- Solution: Check import paths are correct
- Verify package is built: `pnpm run build`
- Ensure pulumi-test has dependencies installed

**Problem: Pulumi preview shows unexpected changes**
- Solution: Check if inputs changed
- Review component implementation
- Verify resource options (ignoreChanges, etc.)

**Problem: Resources not created in Cloudflare**
- Solution: Check environment variables are set
- Verify API token has correct permissions
- Review Pulumi logs for API errors

**Problem: Tests work locally but fail in CI**
- Solution: Check Node.js version matches
- Verify all dependencies are installed
- Check environment variables in CI
