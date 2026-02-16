# Build System and Deployment

## Purpose
This skill provides comprehensive guidance for the build system, package management, and deployment workflows in the drunk-pulumi-cloudflare-components library. Use this when working with the build process, publishing packages, or CI/CD pipelines.

## Build System Overview

### Build Commands
```bash
# Full build (recommended for releases)
pnpm run build

# Fast build (development)
pnpm run fastBuild

# Type check only (fastest)
npx tsc --noEmit

# Generate documentation
pnpm run docs

# Update dependencies
pnpm run update
```

## Full Build Process

### Build Command Breakdown
```bash
pnpm run build
```

**Executes:**
1. `pnpm run update-tsconfig` - Update tsconfig.json with all .ts files
2. `pnpm run fastBuild` - Compile TypeScript
3. `npm run copy-pkg` - Copy package files to bin/

### 1. Update TSConfig (update-tsconfig)
```bash
pnpm run update-tsconfig
# Runs: ts-node ./.tasks/update-tsconfig.ts
```

**Purpose:** Dynamically updates `tsconfig.json` with all TypeScript files in the project.

**What It Does:**
- Scans `src/` directory recursively for `.ts` files
- Updates the `files` array in tsconfig.json
- Ensures all files are included in compilation
- Excludes test files and node_modules

**When to Run:**
- After adding new TypeScript files
- Before releasing a new version
- When files are missing from build output

### 2. Fast Build (fastBuild)
```bash
pnpm run fastBuild
# Runs: cross-env NODE_ENV=production NODE_OPTIONS="--max-old-space-size=4092" npx tsc
```

**Purpose:** Compile TypeScript to JavaScript with type declarations.

**Configuration:**
- **NODE_ENV=production**: Production build mode
- **max-old-space-size=4092**: Allocate 4GB memory for compilation
- Uses settings from `tsconfig.json`

**Output Location:** `bin/` directory

**Generated Files:**
- `.js` files - Compiled JavaScript (CommonJS)
- `.d.ts` files - TypeScript declaration files
- `.js.map` files - Source maps for debugging

### 3. Copy Package (copy-pkg)
```bash
npm run copy-pkg
# Runs: ts-node ./.tasks/npm-package.ts && cpy README.md bin/ && cpy PulumiPlugin.yaml bin/
```

**Purpose:** Prepare the `bin/` directory for npm publication.

**What It Copies:**
1. **Modified package.json** (via npm-package.ts):
   - Removes devDependencies
   - Keeps only runtime dependencies
   - Preserves version, name, description, etc.
2. **README.md** - Project documentation
3. **PulumiPlugin.yaml** - Pulumi plugin metadata

## TypeScript Configuration

### tsconfig.json Structure
```json
{
  "compilerOptions": {
    "baseUrl": "./src",           // Base for module resolution
    "outDir": "./bin",            // Output directory
    "target": "ESNext",           // Modern JavaScript
    "module": "commonjs",         // CommonJS for Node.js
    "moduleResolution": "node",   // Node.js module resolution
    "declaration": true,          // Generate .d.ts files
    "inlineSourceMap": true,      // Include source maps
    "stripInternal": true,        // Remove internal declarations
    "esModuleInterop": true,      // ES/CommonJS interop
    "experimentalDecorators": true,
    "noFallthroughCasesInSwitch": true,
    "forceConsistentCasingInFileNames": true,
    "noImplicitAny": true,
    "strict": true,               // Strict type checking
    "preserveValueImports": false,
    "importsNotUsedAsValues": "remove",
    "verbatimModuleSyntax": false
  },
  "exclude": [
    "node_modules",
    "**/__tests__"
  ],
  "files": [
    // Dynamically populated by update-tsconfig
  ]
}
```

### Key Compiler Options

**Target and Module:**
- `target: ESNext` - Use latest JavaScript features
- `module: commonjs` - CommonJS for Node.js compatibility
- `moduleResolution: node` - Standard Node.js resolution

**Type Safety:**
- `strict: true` - All strict type-checking options
- `noImplicitAny: true` - Require explicit types
- `forceConsistentCasingInFileNames: true` - Case-sensitive imports

**Output:**
- `declaration: true` - Generate .d.ts files for TypeScript consumers
- `inlineSourceMap: true` - Source maps for debugging
- `outDir: ./bin` - All output goes to bin/

## Package Management

### package.json Overview
```json
{
  "name": "@drunk-pulumi/cloudflare-components",
  "version": "0.0.1",
  "description": "The custom components for Pulumi Cloudflare",
  "main": "index.js",
  "types": "index.d.ts",
  "pulumi": {
    "resource": false,
    "name": "@drunk-pulumi/cloudflare-components"
  }
}
```

**Key Fields:**
- **main**: Entry point for require() - `index.js`
- **types**: TypeScript declarations entry - `index.d.ts`
- **pulumi**: Pulumi-specific metadata

### Dependencies

**Runtime Dependencies (Required):**
```json
{
  "@drunk-pulumi/azure-components": "v1.1.20",
  "@pulumi/cloudflare": "^6.12.0",
  "@pulumi/pulumi": "^3.215.0",
  "@pulumi/random": "^4.18.5",
  "cloudflare": "^5.2.0",
  "lodash": "^4.17.21"
}
```

**Development Dependencies (Not Published):**
```json
{
  "@types/jest": "^30.0.0",
  "@types/lodash": "^4.17.23",
  "@types/netmask": "^2.0.6",
  "@types/node": "25.0.6",
  "@typescript-eslint/eslint-plugin": "^8.52.0",
  "@typescript-eslint/parser": "^8.52.0",
  "cpy-cli": "^6.0.0",
  "cross-env": "^10.1.0",
  "ts-node": "^10.9.2",
  "typescript": "5.9.3"
}
```

### Dependency Management

**Install Dependencies:**
```bash
pnpm install
```

**Update Dependencies:**
```bash
pnpm run update
# Runs: npx npm-check-updates -u && pnpm install
```

**Add New Dependency:**
```bash
# Runtime dependency
pnpm add package-name

# Development dependency
pnpm add -D package-name

# Specific version
pnpm add package-name@1.2.3
```

**Remove Dependency:**
```bash
pnpm remove package-name
```

## Build Output Structure

### bin/ Directory Layout
```
bin/
  base/
    BaseComponent.js
    BaseComponent.d.ts
    BaseProvider.js
    BaseProvider.d.ts
    ...
  domain/
    DnsRecords.js
    DnsRecords.d.ts
    ...
  zeroTrust/
    ZeroTrustApplication.js
    ZeroTrustApplication.d.ts
    ...
  index.js
  index.d.ts
  types.js
  types.d.ts
  package.json       # Modified (no devDependencies)
  README.md          # Documentation
  PulumiPlugin.yaml  # Pulumi metadata
```

### Verify Build Output
```bash
# Check bin/ exists and has content
ls -la bin/

# Verify main entry point
cat bin/index.js | head -20

# Check type declarations
cat bin/index.d.ts | head -20

# Verify package.json
cat bin/package.json | jq .devDependencies  # Should be empty

# Check file count matches source
find src -name "*.ts" | wc -l
find bin -name "*.js" | wc -l  # Should be similar
```

## Version Management

### Semantic Versioning
```
MAJOR.MINOR.PATCH
  |     |     |
  |     |     +-- Bug fixes (0.0.2)
  |     +-------- New features (0.1.0)
  +-------------- Breaking changes (1.0.0)
```

### Update Version
```bash
# Manually in package.json
{
  "version": "0.0.2"
}

# Using npm version
npm version patch  # 0.0.1 -> 0.0.2
npm version minor  # 0.0.2 -> 0.1.0
npm version major  # 0.1.0 -> 1.0.0
```

### Version Bumping Pattern
```bash
# 1. Update version
npm version patch -m "Bump version to %s"

# 2. Build
pnpm run build

# 3. Verify
cat bin/package.json | jq .version

# 4. Commit and tag
git add package.json
git commit -m "Release version 0.0.2"
git tag v0.0.2
git push origin main --tags
```

## Package Publishing

### NPM Registry Setup
```bash
# Login to npm
npm login

# Verify authentication
npm whoami

# Check package name availability
npm search @drunk-pulumi/cloudflare-components
```

### Publish Process

**Manual Publishing:**
```bash
# 1. Build the package
pnpm run build

# 2. Navigate to bin/
cd bin

# 3. Publish to npm
npm publish --access public

# 4. Return to root
cd ..
```

**Verify Publication:**
```bash
# Check on npm
npm view @drunk-pulumi/cloudflare-components

# Install in test project
npm install @drunk-pulumi/cloudflare-components

# Verify installation
npm list @drunk-pulumi/cloudflare-components
```

### Pre-publish Checklist
- [ ] All tests pass: `npx tsc --noEmit`
- [ ] Build succeeds: `pnpm run build`
- [ ] Version updated: `package.json`
- [ ] CHANGELOG updated (if exists)
- [ ] README is current
- [ ] No sensitive data in code
- [ ] Git working directory clean
- [ ] Changes committed and pushed

## CI/CD Integration

### GitHub Actions Example
```yaml
name: Build and Publish

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          registry-url: 'https://registry.npmjs.org'
      
      - name: Install pnpm
        run: npm install -g pnpm
      
      - name: Install dependencies
        run: pnpm install
      
      - name: Type check
        run: npx tsc --noEmit
      
      - name: Build
        run: pnpm run build
      
      - name: Publish to npm
        if: github.ref == 'refs/heads/main'
        run: |
          cd bin
          npm publish --access public
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

### Environment Variables for CI
```bash
# Required secrets in GitHub
NPM_TOKEN=npm_xxx...              # npm authentication token
CLOUDFLARE_API_TOKEN=xxx...       # For testing (optional)
CLOUDFLARE_ACCOUNT_ID=xxx...      # For testing (optional)
CLOUDFLARE_ZONE_ID=xxx...         # For testing (optional)
```

## Development Workflow

### Daily Development
```bash
# 1. Make changes to TypeScript files
vim src/MyComponent.ts

# 2. Type check
npx tsc --noEmit

# 3. Fast build
pnpm run fastBuild

# 4. Test in pulumi-test/
cd pulumi-test
npm install
npx tsc --noEmit
```

### Pre-Commit
```bash
# 1. Type check
npx tsc --noEmit

# 2. Full build
pnpm run build

# 3. Test examples
cd pulumi-test && npx tsc --noEmit && cd ..

# 4. Commit
git add .
git commit -m "Add new component"
```

### Release Workflow
```bash
# 1. Update version
npm version minor -m "Release version %s"

# 2. Update CHANGELOG
vim CHANGELOG.md

# 3. Full build
pnpm run build

# 4. Test thoroughly
cd pulumi-test
npx tsc --noEmit
pulumi preview

# 5. Commit and tag
git add .
git commit -m "Prepare release v0.1.0"
git tag v0.1.0

# 6. Push
git push origin main --tags

# 7. Publish
cd bin
npm publish --access public

# 8. Verify
npm view @drunk-pulumi/cloudflare-components@latest
```

## Build Troubleshooting

### Common Build Issues

**Issue: TypeScript compilation fails**
```bash
# Check specific errors
npx tsc --noEmit

# Clean and rebuild
rm -rf bin/
pnpm run build
```

**Issue: Missing files in bin/**
```bash
# Update tsconfig.json
pnpm run update-tsconfig

# Verify files are listed
cat tsconfig.json | jq .files

# Rebuild
pnpm run build
```

**Issue: Out of memory during build**
```bash
# Increase memory allocation
export NODE_OPTIONS="--max-old-space-size=8192"
pnpm run fastBuild
```

**Issue: Wrong files published**
```bash
# Check .npmignore or .gitignore
cat .npmignore

# Verify bin/ contents before publishing
ls -la bin/
```

## Performance Optimization

### Build Speed
```bash
# Use fastBuild during development
pnpm run fastBuild  # ~30 seconds

# Full build only for releases
pnpm run build      # ~60 seconds
```

### Memory Usage
```bash
# Monitor memory during build
/usr/bin/time -v pnpm run build

# Increase if needed
export NODE_OPTIONS="--max-old-space-size=8192"
```

### Incremental Compilation
TypeScript automatically uses incremental compilation:
- Faster rebuilds after initial compilation
- Stores build info in `.tsbuildinfo` files
- Recompiles only changed files

## Build Artifacts

### Git Ignore Pattern
```gitignore
# Build output
bin/
*.tsbuildinfo

# Dependencies
node_modules/

# Environment
.env
.env.local

# IDE
.vscode/
.idea/

# OS
.DS_Store
Thumbs.db
```

### What to Commit
- [x] Source code (`src/`)
- [x] Configuration (`tsconfig.json`, `package.json`)
- [x] Documentation (`README.md`)
- [x] Build scripts (`.tasks/`)
- [ ] Build output (`bin/`)
- [ ] Dependencies (`node_modules/`)
- [ ] Build artifacts (`*.tsbuildinfo`)

## Package Distribution

### NPM Package Structure
```
@drunk-pulumi/cloudflare-components@0.0.1
├── base/
├── domain/
├── zeroTrust/
├── services/
├── index.js
├── index.d.ts
├── package.json
└── README.md
```

### Consumer Installation
```bash
# Install from npm
npm install @drunk-pulumi/cloudflare-components

# Or with specific version
npm install @drunk-pulumi/cloudflare-components@0.0.1

# Or with pnpm
pnpm add @drunk-pulumi/cloudflare-components
```

### Consumer Usage
```typescript
// Import entire library
import * as cf from '@drunk-pulumi/cloudflare-components';

// Import specific components
import {CloudflareZeroTrustAccount} from '@drunk-pulumi/cloudflare-components';

// Import namespaced
import {domain, zeroTrust} from '@drunk-pulumi/cloudflare-components';
```

## Documentation Generation

### Generate Docs
```bash
pnpm run docs
# Runs: ts-node ./.tasks/generate-docs.ts
```

**Output:** Updates `DOCUMENTATION.md` with comprehensive JSDoc documentation.

### JSDoc Standards
```typescript
/**
 * Component description
 * 
 * Detailed explanation of what the component does.
 * 
 * @example
 * const component = new MyComponent('name', {
 *   config: 'value',
 * });
 */
export class MyComponent extends BaseComponent<MyComponentArgs> {
    /**
     * Resource ID output
     */
    public readonly id: pulumi.Output<string>;
}
```

## Best Practices

### Build Practices
1. **Type Check First**: Always run `npx tsc --noEmit` before committing
2. **Clean Builds**: Occasionally delete `bin/` and rebuild from scratch
3. **Version Control**: Commit working code frequently
4. **Test Before Publish**: Thoroughly test in pulumi-test/ before releasing
5. **Semantic Versions**: Follow semver strictly
6. **Changelog**: Document all changes for users

### Development Practices
1. **Fast Feedback**: Use `npx tsc --noEmit` for quick checks
2. **Incremental**: Use `fastBuild` during development
3. **Full Build**: Use full `build` before committing
4. **Dependencies**: Keep dependencies up to date
5. **Memory**: Increase Node.js memory if needed

### Release Practices
1. **Version Bump**: Update version before building
2. **Clean State**: Ensure git working directory is clean
3. **Full Build**: Always use `pnpm run build` for releases
4. **Test Package**: Install and test before publishing
5. **Tag Releases**: Create git tags for all releases
6. **Document**: Update changelog and documentation
