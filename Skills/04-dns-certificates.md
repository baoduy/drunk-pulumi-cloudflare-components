# DNS and Certificate Management

## Purpose
This skill provides guidance for managing DNS records and certificates in the drunk-pulumi-cloudflare-components library. Use this when working with domain configurations, DNS automation, or SSL/TLS certificates.

## DNS Management Components

### DnsRecordsResource (Dynamic Provider)

A dynamic provider for managing DNS records with automatic upsert functionality.

**Key Features:**
- Automatic creation or update of existing records
- Intelligent record matching by subdomain and type
- Automatic cleanup of records no longer in configuration
- Error recovery and duplicate handling
- Support for all major DNS record types

**Supported Record Types:**
- A (IPv4 address)
- AAAA (IPv6 address)
- CNAME (Canonical name)
- TXT (Text records)
- MX (Mail exchange)
- NS (Name server)
- SRV (Service record)
- CAA (Certificate Authority Authorization)

### Basic Usage
```typescript
import {DnsRecordsResource} from '@drunk-pulumi/cloudflare-components';

const dnsRecords = new DnsRecordsResource('my-dns', {
    zoneId: zoneId,
    records: [{
        subdomain: 'www',
        type: 'CNAME',
        content: 'example.com',
        proxied: true,
        ttl: 1,  // Automatic for proxied records
    }, {
        subdomain: 'mail',
        type: 'MX',
        content: 'mail.example.com',
        priority: 10,
        proxied: false,
        ttl: 300,
    }, {
        subdomain: '@',  // Root domain
        type: 'A',
        content: '192.0.2.1',
        proxied: true,
        ttl: 1,
    }],
});
```

### DNS Record Arguments

**Input Interface:**
```typescript
interface DnsRecordsInputs {
    zoneId: string;
    records: Array<{
        subdomain: string;      // Subdomain or '@' for root
        type: string;          // Record type (A, CNAME, etc.)
        content: string;       // Record value
        proxied?: boolean;     // Cloudflare proxy (orange cloud)
        ttl?: number;         // Time to live in seconds
        priority?: number;     // For MX/SRV records
        comment?: string;      // Optional comment
    }>;
}
```

**Output Interface:**
```typescript
interface DnsRecordsOutputs {
    recordIds: Array<{
        subdomain: string;
        type: string;
        id: string;
    }>;
}
```

## DNS Record Types and Patterns

### A Record (IPv4)
```typescript
{
    subdomain: 'server',
    type: 'A',
    content: '192.0.2.100',
    proxied: false,  // No proxy for direct access
    ttl: 300,
}
```

### AAAA Record (IPv6)
```typescript
{
    subdomain: 'server',
    type: 'AAAA',
    content: '2001:0db8:85a3:0000:0000:8a2e:0370:7334',
    proxied: false,
    ttl: 300,
}
```

### CNAME Record
```typescript
{
    subdomain: 'www',
    type: 'CNAME',
    content: 'example.com',
    proxied: true,  // Enable Cloudflare proxy
    ttl: 1,        // Automatic when proxied
}
```

**Important:** CNAME records cannot exist at root (@) - use A/AAAA records instead.

### TXT Record
```typescript
{
    subdomain: '_dmarc',
    type: 'TXT',
    content: 'v=DMARC1; p=quarantine; rua=mailto:dmarc@example.com',
    proxied: false,  // TXT records cannot be proxied
    ttl: 3600,
}
```

**Common TXT Use Cases:**
- SPF: `v=spf1 include:_spf.example.com ~all`
- DKIM: `v=DKIM1; k=rsa; p=...`
- DMARC: `v=DMARC1; p=quarantine; ...`
- Domain verification: Various verification strings

### MX Record (Mail Exchange)
```typescript
{
    subdomain: '@',  // Root domain for mail
    type: 'MX',
    content: 'mail.example.com',
    priority: 10,    // Lower = higher priority
    proxied: false,  // MX records cannot be proxied
    ttl: 3600,
}
```

**Multiple MX Records for Redundancy:**
```typescript
records: [{
    subdomain: '@',
    type: 'MX',
    content: 'mail1.example.com',
    priority: 10,
    proxied: false,
    ttl: 3600,
}, {
    subdomain: '@',
    type: 'MX',
    content: 'mail2.example.com',
    priority: 20,  // Backup
    proxied: false,
    ttl: 3600,
}]
```

### SRV Record (Service)
```typescript
{
    subdomain: '_sip._tcp',
    type: 'SRV',
    content: 'sip.example.com',
    priority: 10,
    proxied: false,
    ttl: 3600,
    // Note: Weight, port handled by content format
}
```

### NS Record (Name Server)
```typescript
{
    subdomain: 'subdomain',
    type: 'NS',
    content: 'ns1.example.com',
    proxied: false,  // NS records cannot be proxied
    ttl: 86400,
}
```

### CAA Record (Certificate Authority Authorization)
```typescript
{
    subdomain: '@',
    type: 'CAA',
    content: '0 issue "letsencrypt.org"',
    proxied: false,
    ttl: 3600,
}
```

## DNS Management Patterns

### Wildcard Records
```typescript
{
    subdomain: '*',
    type: 'CNAME',
    content: 'example.com',
    proxied: true,
    ttl: 1,
}
```

### Multiple Subdomains Pattern
```typescript
const subdomains = ['api', 'app', 'admin', 'dashboard'];

const dnsRecords = new DnsRecordsResource('subdomains', {
    zoneId: zoneId,
    records: subdomains.map(sub => ({
        subdomain: sub,
        type: 'CNAME',
        content: 'server.example.com',
        proxied: true,
        ttl: 1,
    })),
});
```

### Environment-Specific DNS
```typescript
const environment = 'prod';  // or 'dev', 'staging'

const dnsRecords = new DnsRecordsResource(`dns-${environment}`, {
    zoneId: zoneId,
    records: [{
        subdomain: environment === 'prod' ? 'app' : `app-${environment}`,
        type: 'CNAME',
        content: `${environment}-server.example.com`,
        proxied: true,
        ttl: 1,
    }],
});
```

### Load Balancing with Multiple A Records
```typescript
records: [
    { subdomain: 'app', type: 'A', content: '192.0.2.10', proxied: false, ttl: 60 },
    { subdomain: 'app', type: 'A', content: '192.0.2.20', proxied: false, ttl: 60 },
    { subdomain: 'app', type: 'A', content: '192.0.2.30', proxied: false, ttl: 60 },
]
```

## Cloudflare Proxy (Orange Cloud)

### When to Use Proxy
```typescript
// ✅ Good for proxy
{
    subdomain: 'www',
    type: 'CNAME',
    content: 'server.example.com',
    proxied: true,  // Enables CDN, DDoS protection, WAF
    ttl: 1,        // Auto when proxied
}
```

**Benefits:**
- DDoS protection
- CDN and caching
- Web Application Firewall (WAF)
- SSL/TLS encryption
- Bot management
- Analytics

### When NOT to Use Proxy
```typescript
// ❌ Cannot proxy these record types
{
    type: 'MX',      // Mail exchange
    proxied: false,
}
{
    type: 'TXT',     // Text records
    proxied: false,
}
{
    type: 'NS',      // Name servers
    proxied: false,
}

// ❌ Should not proxy these use cases
{
    subdomain: 'mail',
    type: 'A',
    content: '192.0.2.100',
    proxied: false,  // Direct mail server access needed
}
{
    subdomain: 'ssh',
    type: 'A',
    content: '192.0.2.101',
    proxied: false,  // SSH requires direct connection
}
```

## Certificate Management

### Origin Certificates (OriginCertResource)

Origin certificates provide end-to-end encryption between Cloudflare and your origin server.

**Dynamic Provider for Origin Certificates:**
```typescript
import {OriginCertResource} from '@drunk-pulumi/cloudflare-components';

const originCert = new OriginCertResource('origin-cert', {
    zoneId: zoneId,
    hostnames: [
        'example.com',
        '*.example.com',
    ],
    requestType: 'origin-rsa',  // or 'origin-ecc'
    requestedValidity: 5475,    // Days (15 years max)
});

// Use outputs
export const certificate = originCert.certificate;
export const privateKey = originCert.privateKey;
```

**Input Interface:**
```typescript
interface OriginCertInputs {
    zoneId: string;
    hostnames: string[];           // Domains/wildcards to cover
    requestType: 'origin-rsa' | 'origin-ecc';
    requestedValidity: number;     // Days (max 5475 = 15 years)
}
```

**Output Interface:**
```typescript
interface OriginCertOutputs {
    id: string;
    certificate: string;    // PEM-encoded certificate
    privateKey: string;     // PEM-encoded private key
    expiresOn: string;     // Expiration date
}
```

### Certificate Use Cases

**1. Nginx Configuration:**
```typescript
const cert = new OriginCertResource('nginx-cert', {
    zoneId: zoneId,
    hostnames: ['*.example.com'],
    requestType: 'origin-rsa',
    requestedValidity: 5475,
});

// Store in files or secrets
const certFile = new local.File('nginx-cert', {
    filename: '/etc/nginx/ssl/cert.pem',
    content: cert.certificate,
});

const keyFile = new local.File('nginx-key', {
    filename: '/etc/nginx/ssl/key.pem',
    content: cert.privateKey,
    filePermission: '0600',
});
```

**2. Store in Azure Key Vault:**
```typescript
import {VaultSecret} from '@drunk-pulumi/azure-components';

const certSecret = new VaultSecret('origin-cert', {
    vaultId: vault.id,
    name: 'origin-certificate',
    value: cert.certificate,
});

const keySecret = new VaultSecret('origin-key', {
    vaultId: vault.id,
    name: 'origin-private-key',
    value: cert.privateKey,
});
```

**3. Kubernetes Secret:**
```typescript
import * as k8s from '@pulumi/kubernetes';

const tlsSecret = new k8s.core.v1.Secret('tls-secret', {
    metadata: { name: 'origin-tls' },
    type: 'kubernetes.io/tls',
    stringData: {
        'tls.crt': cert.certificate,
        'tls.key': cert.privateKey,
    },
});
```

## Integration with Zero Trust Tunnels

### Automatic DNS for Tunnel Routes
When using Zero Trust applications, DNS records are created automatically:

```typescript
new ZeroAnonymousApplication('tunnel-routes', {
    tunnelId: tunnel.id,
    anonymousHosts: [{
        fqdn: 'app.example.com',
        service: 'http://backend:80',
    }],
});
// Automatically creates: app.example.com CNAME -> tunnel-id.cfargotunnel.com
```

### Manual DNS for Tunnels
For custom configurations:

```typescript
const tunnel = new cf.ZeroTrustTunnelCloudflared('tunnel', {
    accountId: accountId,
    name: 'my-tunnel',
    secret: tunnelSecret,
});

const dnsRecords = new DnsRecordsResource('tunnel-dns', {
    zoneId: zoneId,
    records: [{
        subdomain: 'tunnel',
        type: 'CNAME',
        content: pulumi.interpolate`${tunnel.id}.cfargotunnel.com`,
        proxied: true,
        ttl: 1,
    }],
});
```

## Advanced DNS Patterns

### Dynamic Records from Array
```typescript
const services = [
    { name: 'api', port: 8080 },
    { name: 'web', port: 3000 },
    { name: 'admin', port: 9000 },
];

const dnsRecords = new DnsRecordsResource('service-dns', {
    zoneId: zoneId,
    records: services.map(svc => ({
        subdomain: svc.name,
        type: 'CNAME',
        content: 'server.example.com',
        proxied: true,
        ttl: 1,
    })),
});
```

### Conditional DNS Records
```typescript
const isProd = environment === 'production';

const records: Array<DnsRecordInput> = [{
    subdomain: 'app',
    type: 'CNAME',
    content: 'server.example.com',
    proxied: true,
    ttl: 1,
}];

// Add staging record only in non-prod
if (!isProd) {
    records.push({
        subdomain: 'staging',
        type: 'CNAME',
        content: 'staging-server.example.com',
        proxied: true,
        ttl: 1,
    });
}

const dnsRecords = new DnsRecordsResource('conditional-dns', {
    zoneId: zoneId,
    records: records,
});
```

### Geographic DNS (Pulumi Outputs)
```typescript
const primaryServer = loadBalancer.apply(lb => lb.primaryIp);
const backupServer = loadBalancer.apply(lb => lb.backupIp);

const dnsRecords = new DnsRecordsResource('geo-dns', {
    zoneId: zoneId,
    records: [
        pulumi.output(primaryServer).apply(ip => ({
            subdomain: 'app',
            type: 'A',
            content: ip,
            proxied: true,
            ttl: 1,
        })),
    ],
});
```

## DNS Helper Functions

### Domain Helper API
For manual DNS operations via Cloudflare API:

```typescript
import {domainHelper} from './helpers';

// Create DNS record
const record = await domainHelper('/dns_records', 'POST', {
    type: 'A',
    name: 'api.example.com',
    content: '192.0.2.1',
    ttl: 300,
    proxied: true,
});

// Update DNS record
await domainHelper(`/dns_records/${record.id}`, 'PATCH', {
    content: '192.0.2.2',
});

// Delete DNS record
await domainHelper(`/dns_records/${record.id}`, 'DELETE');

// List DNS records
const records = await domainHelper('/dns_records', 'GET');
```

## Cloudflare Client Integration

Using the Cloudflare SDK directly:

```typescript
import {commonHelpers} from './base';

const client = commonHelpers.getCloudflareClient();

// Create DNS record
const record = await client.dns.records.create({
    zone_id: commonHelpers.cloudflareZoneId,
    type: 'A',
    name: 'api',
    content: '192.0.2.1',
    ttl: 300,
    proxied: true,
});

// List DNS records
const records = await client.dns.records.list({
    zone_id: commonHelpers.cloudflareZoneId,
});
```

## Best Practices

### DNS Records
1. **Use Proxied Records**: Enable proxy for HTTP/HTTPS services when possible
2. **Set Appropriate TTL**: Low TTL (300s) for changing IPs, high TTL (86400s) for stable records
3. **Wildcard Carefully**: Only use wildcards when necessary
4. **Document Records**: Add comments to explain purpose
5. **Version Control**: Track all DNS changes in code
6. **Test Changes**: Verify DNS propagation after updates
7. **Use CNAME**: Prefer CNAME over A records when pointing to other domains
8. **Root Domain**: Cannot use CNAME at root - use A/AAAA records

### Certificates
1. **Use Origin Certificates**: For Cloudflare proxied connections
2. **Wildcard Certificates**: Use `*.example.com` for multiple subdomains
3. **Store Securely**: Keep private keys in secrets management (Key Vault)
4. **Long Validity**: Use max 15 years for origin certificates
5. **Rotate Regularly**: Even with long validity, rotate certificates periodically
6. **Backup Certificates**: Store certificates in version control (encrypted)
7. **Monitor Expiration**: Track certificate expiration dates

### Security
1. **Enable DNSSEC**: Configure DNSSEC in Cloudflare dashboard
2. **CAA Records**: Specify authorized certificate authorities
3. **HTTPS Only**: Redirect HTTP to HTTPS
4. **HSTS**: Enable HTTP Strict Transport Security
5. **Certificate Pinning**: For mobile apps, consider certificate pinning
6. **Access Control**: Limit who can modify DNS records
7. **Audit Logs**: Monitor DNS changes via Cloudflare logs

## Troubleshooting

### DNS Issues

**Problem: DNS not resolving**
- Check record exists: `dig subdomain.example.com`
- Verify nameservers: `dig NS example.com`
- Check Cloudflare proxy status
- Wait for propagation (up to 48 hours, usually minutes)

**Problem: CNAME at root not working**
- Cannot use CNAME at root (@)
- Use A or AAAA records instead
- Or use Cloudflare CNAME flattening

**Problem: Record not updating**
- Check DnsRecordsResource is updating
- Verify zone ID is correct
- Check for duplicate records
- Review Pulumi diff for changes

### Certificate Issues

**Problem: Certificate not trusted**
- Origin certificates only work with Cloudflare proxy
- Use proper certificate chain
- Verify hostname matches certificate

**Problem: Private key mismatch**
- Ensure certificate and private key match
- Regenerate if necessary
- Check PEM format

**Problem: Certificate expired**
- Generate new certificate
- Update all locations using certificate
- Verify expiration date before deployment

## Migration Patterns

### Migrating Existing DNS
```typescript
// Export existing DNS records from Cloudflare
const existingRecords = [
    { subdomain: 'www', type: 'CNAME', content: 'old-server.com', proxied: true },
    { subdomain: 'mail', type: 'MX', content: 'mail-server.com', priority: 10 },
    // ... more records
];

// Import into Pulumi
const dnsRecords = new DnsRecordsResource('migrated-dns', {
    zoneId: zoneId,
    records: existingRecords.map(r => ({
        subdomain: r.subdomain,
        type: r.type,
        content: r.content,
        proxied: r.proxied ?? false,
        priority: r.priority,
        ttl: r.proxied ? 1 : 300,
    })),
});
```

### Gradual Certificate Rotation
```typescript
// Step 1: Generate new certificate
const newCert = new OriginCertResource('new-cert', {
    zoneId: zoneId,
    hostnames: ['*.example.com'],
    requestType: 'origin-rsa',
    requestedValidity: 5475,
});

// Step 2: Deploy new certificate to servers (manual or automated)
// Step 3: Verify new certificate works
// Step 4: Remove old certificate resource
```
