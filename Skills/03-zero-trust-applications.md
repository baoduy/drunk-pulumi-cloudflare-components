# Zero Trust Application Development

## Purpose
This skill provides detailed guidance for working with Cloudflare Zero Trust components in the drunk-pulumi-cloudflare-components library. Use this when creating or modifying Zero Trust applications, tunnels, policies, or device settings.

## Zero Trust Architecture Overview

The Zero Trust implementation in this library consists of:

1. **CloudflareZeroTrustAccount** - Main orchestration component
2. **Zero Trust Applications** - Public and private application access
3. **Anonymous Applications** - Public routes without authentication
4. **Device Settings** - WARP client configuration
5. **Device Posture Rules** - Compliance and security checks
6. **Access Policies** - SSO and device authentication requirements
7. **Tunnels & Virtual Networks** - Private network connectivity

## CloudflareZeroTrustAccount Component

### Purpose
Main component that orchestrates the entire Zero Trust setup including organization, identity providers, device policies, tunnels, and applications.

### Key Features
- Azure AD integration for SSO via Entra ID
- Device enrollment with posture checks
- WARP client management
- Tunnel creation with virtual networks
- Gateway certificate management
- Intune device compliance integration

### Basic Usage
```typescript
import {CloudflareZeroTrustAccount} from '@drunk-pulumi/cloudflare-components';

const zeroTrust = new CloudflareZeroTrustAccount('my-zero-trust', {
    organization: {
        name: 'my-org',
        authDomain: 'myorg.cloudflareaccess.com',
    },
    enableAzIdentity: true,
    enableDeviceIntuneIntegration: true,
    vault: {
        vaultId: azureVault.id,
        resourceGroupName: resourceGroup.name,
    },
    tunnels: [{
        name: 'main-tunnel',
        applications: [{
            name: 'private-app',
            privateHostNames: [{
                fqdn: 'internal.example.com',
                port: 443,
            }],
        }],
    }],
});
```

### Arguments Structure
```typescript
interface CloudflareZeroTrustAccountArgs {
    // Organization setup
    organization?: {
        name: string;
        // Additional Cloudflare organization settings
    };
    
    // Azure integration
    enableAzIdentity?: boolean;
    enableDeviceIntuneIntegration?: boolean;
    vault?: {
        vaultId: pulumi.Input<string>;
        resourceGroupName: pulumi.Input<string>;
    };
    
    // Gateway settings
    gatewaySettings?: Partial<Pick<cf.ZeroTrustGatewaySettingsArgs, 'settings'>>;
    
    // Device settings
    deviceSettings?: Partial<Omit<cf.ZeroTrustDeviceSettingsArgs, 'accountId' | 'zoneId'>>;
    
    // Device profiles
    deviceProfiles?: {
        localIncludesIpAddressSpaces?: string[];
        allowedDevicePlatforms?: ('windows' | 'mac' | 'linux' | 'android' | 'ios' | 'chromeos')[];
        enablePrivateHostNameRoute?: boolean;
    };
    
    // Tunnels configuration
    tunnels?: Array<TunnelArgs>;
    
    // Gateway rules import
    imports?: {
        gatewayRulesDirectory?: string;
    };
}
```

## Zero Trust Application Types

### 1. ZeroTrustApplication (Authenticated Access)

Used for applications requiring Cloudflare authentication with optional device compliance.

**Access Patterns:**
- **Public Routes**: Accessible from internet with SSO authentication
- **Private Hosts**: Accessible via WARP with device posture checks
- **Private IPs**: CIDR-based access via WARP tunnel

**Example:**
```typescript
import {ZeroTrustApplication} from '@drunk-pulumi/cloudflare-components';

const app = new ZeroTrustApplication('secure-app', {
    name: 'Secure Application',
    tunnelId: tunnel.id,
    virtualNetworkId: virtualNetwork.id,
    
    // Public routes (internet accessible with auth)
    publicHostNames: [{
        fqdn: 'app.example.com',
        service: 'https://backend:443',
    }],
    
    // Private hosts (WARP only)
    privateHostNames: [{
        fqdn: 'internal-api.corp',
        port: 8080,
    }],
    
    // Private IP ranges (WARP only)
    privateIpAddresses: [{
        cidr: '10.0.0.0/24',
        port: 443,
        protocol: 'tcp',
    }],
    
    // Access policies
    policies: [ssoPolicy.id, devicePosturePolicy.id],
});
```

### 2. ZeroAnonymousApplication (Public Access)

Used for public routes that don't require authentication but still route through Cloudflare Tunnel.

**Use Cases:**
- Public websites
- API endpoints with their own authentication
- Static content delivery

**Example:**
```typescript
import {ZeroAnonymousApplication} from '@drunk-pulumi/cloudflare-components';

const publicApp = new ZeroAnonymousApplication('public-site', {
    tunnelId: tunnel.id,
    anonymousHosts: [{
        fqdn: 'www.example.com',
        service: 'http://webserver:80',
    }, {
        fqdn: 'api.example.com',
        service: 'https://api-server:443',
    }],
});
```

### Route Configuration Details

**Public Hostname Args:**
```typescript
interface PublicHostNameArgs {
    fqdn: string;           // Fully qualified domain name
    service: string;        // Backend service URL (http://host:port)
    path?: string;          // Optional URL path matching
}
```

**Private Hostname Args:**
```typescript
interface PrivateHostNameArgs {
    fqdn: string;           // Private hostname
    port: number;           // Service port
}
```

**Private IP Address Args:**
```typescript
interface PrivateIpAddressArgs {
    cidr: string;           // IP CIDR range (e.g., '10.0.0.0/24')
    port: number;           // Service port
    protocol?: 'tcp' | 'udp';  // Default: 'tcp'
}
```

## Tunnel Configuration

### Tunnel Setup in CloudflareZeroTrustAccount
```typescript
tunnels: [{
    name: 'production-tunnel',
    configSrc: 'cloudflare',  // 'local' or 'cloudflare'
    
    // Applications requiring authentication
    applications: [{
        name: 'admin-portal',
        publicHostNames: [{
            fqdn: 'admin.example.com',
            service: 'https://admin-backend:443',
        }],
        policies: {
            requiredSso: true,
            requiredDevicePosture: true,
            groupIds: ['admin-group-id'],
        },
    }],
    
    // Public routes without authentication
    anonymousRoutes: [{
        fqdn: 'public.example.com',
        service: 'http://public-backend:80',
    }],
}]
```

### Tunnel Components Created
For each tunnel, the following are created:
1. **cf.ZeroTrustTunnelCloudflared** - The tunnel itself
2. **cf.ZeroTrustTunnelCloudflaredVirtualNetwork** - Virtual network for private routing
3. **RandomPassword** - Tunnel secret
4. **VaultSecret** - Tunnel secret stored in Azure Key Vault
5. **ZeroTrustApplication** - For each authenticated application
6. **ZeroAnonymousApplication** - For anonymous routes

## Access Policies

### Policy Types

**SSO Policy** - Requires Azure AD authentication:
```typescript
const ssoPolicy = new cf.ZeroTrustAccessPolicy('sso-policy', {
    accountId: accountId,
    name: 'Require SSO',
    decision: 'allow',
    includes: [{
        azures: [{id: identityProviderId}],
    }],
});
```

**Device Posture Policy** - Requires compliant device:
```typescript
const posturePolicy = new cf.ZeroTrustAccessPolicy('device-policy', {
    accountId: accountId,
    name: 'Require Compliant Device',
    decision: 'allow',
    includes: [{
        azures: [{id: identityProviderId}],
    }],
    requires: [{
        devicePostures: [warpRule.id, gatewayRule.id],
    }],
});
```

**Group-Based Policy** - Requires specific Azure AD group:
```typescript
const groupPolicy = new cf.ZeroTrustAccessPolicy('group-policy', {
    accountId: accountId,
    name: 'Admin Group Access',
    decision: 'allow',
    includes: [{
        azures: [{
            id: identityProviderId,
            identityProviderId: identityProviderId,
        }],
        groups: [{id: adminGroupId}],
    }],
});
```

### Policy Application
Policies are applied to applications via the `policies` argument:
```typescript
new ZeroTrustApplication('app', {
    // ... other config
    policies: [
        ssoPolicy.id,
        devicePosturePolicy.id,
        groupPolicy.id,
    ],
});
```

## Device Management

### Device Posture Rules

**WARP Client Check:**
```typescript
const warpRule = new cf.ZeroTrustDevicePostureRule('warp-check', {
    accountId: accountId,
    name: 'WARP Connected',
    type: 'warp',
    match: [{
        platform: 'windows',
    }],
});
```

**Gateway Client Check:**
```typescript
const gatewayRule = new cf.ZeroTrustDevicePostureRule('gateway-check', {
    accountId: accountId,
    name: 'Gateway Filtering Enabled',
    type: 'gateway',
    match: [{
        platform: 'windows',
    }],
});
```

**Intune Compliance Check:**
```typescript
const intuneRule = new cf.ZeroTrustDevicePostureRule('intune-check', {
    accountId: accountId,
    name: 'Intune Compliant Device',
    type: 'intune',
    inputs: [{
        complianceStatus: 'compliant',
        connectionId: intuneIntegration.id,
    }],
    match: [{
        platform: 'windows',
    }],
});
```

### Device Settings (WARP Configuration)

Configured via dynamic provider `ZeroTrustDeviceSettingsResource`:

```typescript
import {ZeroTrustDeviceSettingsResource} from '@drunk-pulumi/cloudflare-components';

const deviceSettings = new ZeroTrustDeviceSettingsResource('device-settings', {
    accountId: accountId,
    settings: {
        // Gateway proxy for TCP/UDP filtering
        gatewayProxyEnabled: true,
        gatewayProxyDefaultTCP: true,
        gatewayProxyDefaultUDP: false,
        
        // Override code for temporary bypass
        overrideCode: 'BYPASS-CODE-123',
        overrideCodeDuration: 3600,  // 1 hour
        
        // Root certificate installation
        rootCertificateInstall: true,
        
        // Virtual IPv4 assignment
        useVirtualIpv4: true,
    },
});
```

### Device Profiles (Split Tunnel Configuration)

```typescript
deviceProfiles: {
    // IP ranges to route through WARP
    localIncludesIpAddressSpaces: [
        '10.0.0.0/8',
        '172.16.0.0/12',
        '192.168.0.0/16',
    ],
    
    // Platforms allowed to enroll
    allowedDevicePlatforms: [
        'windows',
        'mac',
        'linux',
        'ios',
        'android',
    ],
    
    // Enable private hostname resolution
    enablePrivateHostNameRoute: true,
}
```

## Connectivity Settings

Configured via `ZeroTrustConnectivitySettingsResource`:

```typescript
import {ZeroTrustConnectivitySettingsResource} from '@drunk-pulumi/cloudflare-components';

const connectivity = new ZeroTrustConnectivitySettingsResource('connectivity', {
    accountId: accountId,
    settings: {
        icmpProxyEnabled: true,  // Enable ICMP (ping) through WARP
        offrampWarpRouting: true,  // Enable WARP routing for egress
    },
});
```

## Gateway Certificate Management

Gateway certificates enable TLS inspection for Zero Trust filtering:

```typescript
import {ZeroTrustGatewayCertificateActivationResource} from '@drunk-pulumi/cloudflare-components';

const gatewayCert = new ZeroTrustGatewayCertificateActivationResource('gateway-cert', {
    accountId: accountId,
});
```

## Azure AD Integration

### Identity Provider Configuration
```typescript
const idp = new cf.ZeroTrustAccessIdentityProvider('azure-ad', {
    accountId: accountId,
    name: 'Azure AD',
    type: 'azureAD',
    configs: [{
        clientId: azureApp.applicationId,
        clientSecret: azureAppSecret,
        directoryId: tenantId,
        supportGroups: true,
        scimEnabled: true,
        scimToken: scimToken,
    }],
});
```

### SCIM Provisioning
When `scimEnabled: true`, Cloudflare syncs users and groups from Azure AD.

### Group Synchronization
Groups from Azure AD can be used in Access policies for fine-grained access control.

## DNS Record Management

DNS records are automatically created for public routes:

```typescript
// Automatic CNAME creation for public hostname
publicHostNames: [{
    fqdn: 'app.example.com',  // Creates: app CNAME -> tunnel-id.cfargotunnel.com
    service: 'https://backend:443',
}]
```

Manual DNS management via `DnsRecordsResource`:
```typescript
import {DnsRecordsResource} from '@drunk-pulumi/cloudflare-components';

const dnsRecords = new DnsRecordsResource('dns-records', {
    zoneId: zoneId,
    records: [{
        subdomain: 'www',
        type: 'CNAME',
        content: 'example.com',
        proxied: true,
        ttl: 1,
    }],
});
```

## Import Existing Resources

### Import Gateway Rules
```typescript
imports: {
    gatewayRulesDirectory: './gateway-rules',
}
```

Uses `ZeroTrustPoliciesImportResource` to import JSON rule definitions.

## CIDR Tools for Exclusions

The library includes CIDR manipulation tools for managing device exclusions:

```typescript
import * as cidrTools from '@drunk-pulumi/cloudflare-components/cidr-tools';

// Merge and optimize CIDR ranges
const mergedCidrs = cidrTools.merge([
    '10.0.0.0/24',
    '10.0.1.0/24',
    '10.0.2.0/28',
]);

// Exclude specific ranges
const excludedCidrs = cidrTools.exclude(
    ['10.0.0.0/16'],
    ['10.0.50.0/24', '10.0.100.0/24']
);
```

## Common Patterns

### Multi-Tier Application
```typescript
const zeroTrust = new CloudflareZeroTrustAccount('multi-tier', {
    organization: { name: 'my-org' },
    enableAzIdentity: true,
    tunnels: [{
        name: 'main',
        applications: [{
            name: 'web-tier',
            publicHostNames: [{
                fqdn: 'app.example.com',
                service: 'https://web:443',
            }],
            policies: { requiredSso: true },
        }, {
            name: 'api-tier',
            privateHostNames: [{
                fqdn: 'api.internal',
                port: 8080,
            }],
            policies: {
                requiredSso: true,
                requiredDevicePosture: true,
            },
        }, {
            name: 'database-tier',
            privateIpAddresses: [{
                cidr: '10.0.10.0/24',
                port: 5432,
            }],
            policies: {
                requiredSso: true,
                requiredDevicePosture: true,
                groupIds: ['db-admin-group'],
            },
        }],
    }],
});
```

### Development and Production Split
```typescript
tunnels: [{
    name: 'dev-tunnel',
    applications: [{
        name: 'dev-apps',
        publicHostNames: [
            { fqdn: 'dev-app1.example.com', service: 'http://dev1:80' },
            { fqdn: 'dev-app2.example.com', service: 'http://dev2:80' },
        ],
        policies: { requiredSso: true, groupIds: ['developers'] },
    }],
}, {
    name: 'prod-tunnel',
    applications: [{
        name: 'prod-apps',
        publicHostNames: [
            { fqdn: 'app.example.com', service: 'https://prod:443' },
        ],
        policies: {
            requiredSso: true,
            requiredDevicePosture: true,
            groupIds: ['production-access'],
        },
    }],
}]
```

## Best Practices

1. **Use Virtual Networks**: Always create virtual networks for private routing
2. **Store Tunnel Secrets**: Use Azure Key Vault for tunnel secret storage
3. **Layer Policies**: Combine SSO + device posture for sensitive applications
4. **Split Tunneling**: Configure device profiles to only route necessary traffic
5. **Group-Based Access**: Use Azure AD groups for fine-grained access control
6. **Monitor Gateway**: Enable gateway logging for security monitoring
7. **Test Incrementally**: Deploy tunnels and applications incrementally
8. **Document Routes**: Clearly document which applications use which routes
9. **Backup Policies**: Export gateway rules and policies for disaster recovery
10. **Review Compliance**: Regularly audit device posture rules and compliance

## Troubleshooting

### Common Issues

**Issue: Tunnel not connecting**
- Verify tunnel secret is correct
- Check virtual network configuration
- Ensure cloudflared daemon has network access

**Issue: Device can't access private routes**
- Verify WARP client is connected
- Check device posture rules are passing
- Confirm device profile includes necessary IP ranges

**Issue: SSO not working**
- Verify Azure AD app registration is correct
- Check identity provider configuration
- Ensure SCIM token is valid

**Issue: DNS not resolving**
- Verify DNS records were created
- Check Cloudflare proxy settings
- Confirm zone ID is correct

## Security Considerations

1. **Least Privilege**: Only grant minimum necessary access
2. **Device Compliance**: Always require device posture for sensitive apps
3. **Secret Rotation**: Regularly rotate tunnel secrets and tokens
4. **Audit Logs**: Enable and monitor Cloudflare Access logs
5. **MFA Required**: Enforce MFA at Azure AD level
6. **Certificate Validation**: Use gateway certificates for TLS inspection
7. **IP Restrictions**: Combine Zero Trust with IP allowlists where appropriate
8. **Session Duration**: Configure appropriate session timeouts
