# Drunk Pulumi Cloudflare Components - Skills

This folder contains comprehensive GitHub Copilot skills for the drunk-pulumi-cloudflare-components library. These skills help developers understand, build, test, and maintain the library effectively.

## Skills Overview

### 01-library-overview.md
**Purpose**: Architecture and foundational patterns
- Component hierarchy and base classes
- Directory structure and organization
- Environment variable configuration
- TypeScript conventions and patterns
- Integration points with Azure components
- Common pitfalls and best practices

**Use When**: 
- Starting work on the library
- Understanding overall architecture
- Learning component patterns
- Troubleshooting structure issues

### 02-component-development.md
**Purpose**: Creating and developing new components
- Component types (Simple, Dynamic Provider, Composite)
- Development templates and patterns
- Input/output design principles
- Resource options management
- API integration patterns
- Testing components

**Use When**:
- Creating new components
- Extending existing components
- Working with Pulumi resources
- Integrating Cloudflare APIs

### 03-zero-trust-applications.md
**Purpose**: Zero Trust infrastructure patterns
- CloudflareZeroTrustAccount configuration
- Zero Trust application types
- Tunnel and virtual network setup
- Access policies and device posture
- Azure AD SSO integration
- Gateway and device management

**Use When**:
- Setting up Zero Trust infrastructure
- Configuring tunnels and applications
- Managing device policies
- Integrating with Azure AD
- Troubleshooting Zero Trust issues

### 04-dns-certificates.md
**Purpose**: DNS and SSL/TLS management
- DNS record management with DnsRecordsResource
- All DNS record types (A, CNAME, MX, TXT, etc.)
- Cloudflare proxy configuration
- Origin certificate management
- Certificate integration patterns
- DNS automation and patterns

**Use When**:
- Managing DNS records
- Configuring SSL/TLS certificates
- Setting up domain routing
- Troubleshooting DNS issues
- Integrating certificates with infrastructure

### 05-testing-validation.md
**Purpose**: Testing, validation, and quality assurance
- TypeScript type checking
- Build validation
- Integration testing in pulumi-test/
- Manual validation procedures
- Test-driven development patterns
- CI/CD integration

**Use When**:
- Testing new components
- Validating code changes
- Debugging issues
- Setting up CI/CD
- Ensuring code quality

### 06-build-deployment.md
**Purpose**: Build system and package deployment
- Build process and commands
- TypeScript configuration
- Package management
- Version management
- NPM publishing
- CI/CD workflows

**Use When**:
- Building the library
- Managing dependencies
- Publishing to npm
- Setting up CI/CD
- Troubleshooting build issues

## How to Use These Skills

### For New Team Members
1. Start with **01-library-overview.md** to understand the architecture
2. Read **02-component-development.md** for development patterns
3. Review **05-testing-validation.md** for quality practices
4. Reference **06-build-deployment.md** for build and release

### For Component Development
1. Review **02-component-development.md** for templates
2. Check **01-library-overview.md** for patterns
3. Use **05-testing-validation.md** for testing
4. Reference specific skills for features:
   - Zero Trust: **03-zero-trust-applications.md**
   - DNS/Certs: **04-dns-certificates.md**

### For Infrastructure Setup
1. Use **03-zero-trust-applications.md** for Zero Trust setup
2. Reference **04-dns-certificates.md** for DNS configuration
3. Check **01-library-overview.md** for integration patterns

### For Maintenance and Testing
1. Follow **05-testing-validation.md** for testing procedures
2. Use **06-build-deployment.md** for build and release
3. Reference **01-library-overview.md** for troubleshooting

## GitHub Copilot Integration

These skills are designed to work with GitHub Copilot to provide:

### Context-Aware Suggestions
- Copilot reads these files to understand library patterns
- Provides code completions matching library conventions
- Suggests proper component structure and patterns

### Code Generation
- Generate components following library patterns
- Create tests matching library standards
- Produce documentation in library style

### Troubleshooting
- Reference common issues and solutions
- Suggest fixes based on library patterns
- Provide debugging guidance

## Keeping Skills Updated

### When to Update Skills
- After significant architectural changes
- When adding major new features
- After establishing new patterns
- When finding common mistakes

### How to Update Skills
1. Identify the relevant skill file
2. Update sections with new information
3. Add examples for new patterns
4. Update troubleshooting sections
5. Test that examples work correctly

## Quick Reference

### Essential Commands
```bash
# Build and validate
npx tsc --noEmit        # Type check
pnpm run build          # Full build
cd pulumi-test && npx tsc --noEmit  # Test examples

# Development
pnpm run fastBuild      # Fast build
pnpm install            # Install deps
pnpm run update         # Update deps

# Testing
pulumi preview          # Preview changes
pulumi up               # Deploy
pulumi destroy          # Clean up
```

### Environment Variables
```bash
CLOUDFLARE_API_TOKEN    # Required: API authentication
CLOUDFLARE_ACCOUNT_ID   # Required: Account ID
CLOUDFLARE_ZONE_ID      # Required: Zone ID for DNS
```

### Common Patterns
- Extend `BaseComponent<TArgs>` for standard components
- Use `BaseProvider` + `BaseResource` for dynamic resources
- Always set `parent: this` for child resources
- Implement `getOutputs()` and call `registerOutputs()`
- Use `pulumi.Input<T>` for flexible input types

## Contributing

When adding new patterns or components to the library:

1. **Update Documentation**: Add to relevant skill files
2. **Add Examples**: Include working code examples
3. **Document Pitfalls**: Note common mistakes
4. **Update Troubleshooting**: Add known issues and solutions
5. **Test Examples**: Ensure all examples work

## Support

For questions or issues:
- Review relevant skill files first
- Check troubleshooting sections
- Test examples in pulumi-test/
- Validate with type checking and builds

## Skill Maintenance Checklist

When reviewing skills:
- [ ] All examples compile with `npx tsc --noEmit`
- [ ] Code patterns match current library implementation
- [ ] Troubleshooting sections address common issues
- [ ] Best practices are current and relevant
- [ ] External dependencies are up to date
- [ ] Links and references work correctly
- [ ] Examples are complete and runnable
