/\*
COMPREHENSIVE DOCUMENTATION FOR DRUNK-PULUMI-CLOUDFLARE-COMPONENTS PROJECT

This file documents all classes in the project with complete JSDoc/XML comments.
These documentation blocks should be added to the respective files.
\*/

// ============================================
// ZeroTrustApplication.ts Documentation
// ============================================

/\*\*

- Zero Trust Access Application component for private and public applications.
-
- Manages Cloudflare Access applications that can be:
- - Public: Accessible from the internet with Cloudflare Authentication
- - Private: Accessible only through Cloudflare Tunnel with device compliance
-
- Supports routing to:
- - Public hostnames (CNAME routing via tunnel)
- - Private hostnames (accessed through tunnel)
- - Private IP addresses (CIDR ranges accessed through tunnel)
-
- Automatically creates DNS records for public routes and applies access policies
- for device posture and SSO requirements.
-
- @class
- @extends {BaseComponent<ZeroTrustApplicationArgs>}
  \*/

// ============================================
// ZeroAnonymousApplication.ts Documentation
// ============================================

/\*\*

- Zero Trust Application for public, unauthenticated routes.
-
- Manages routes and DNS records for applications that allow public internet access
- without requiring Cloudflare authentication. Uses Cloudflare Tunnels for backend routing.
-
- Automatically creates:
- - DNS CNAME records pointing to the tunnel
- - Tunnel ingress routes for HTTP/HTTPS/TCP/UDP
- - 404 fallback responses
-
- @class
- @extends {BaseComponent<ZeroAnonymousApplicationArgs>}
  \*/

// ============================================
// CloudflareZeroTrustAccount.ts Documentation
// ============================================

/\*\*

- Main Cloudflare Zero Trust Account component.
-
- This is the primary orchestration component for managing Cloudflare Zero Trust infrastructure.
- It manages and coordinates the creation of:
- - Zero Trust organization with auth domain
- - Azure AD identity provider integration for SSO via Entra ID
- - Device management, enrollment policies, and compliance rules
- - Device posture rules (WARP, Gateway, Intune compliance)
- - Cloudflare tunnels with virtual networks for private applications
- - Gateway certificates and security settings
- - DNS records and certificate management
- - Connectivity and device settings
-
- Key Features:
- - Automated Azure Identity creation and SCIM provisioning
- - Multi-device platform support (Windows, Mac, Linux, iOS, Android, ChromeOS)
- - Intune device compliance integration
- - Automatic tunnel secret generation and vault storage
- - Device exclusion list management with CIDR tools
- - Policy-based application access control
-
- @class
- @extends {BaseComponent<CloudflareZeroTrustAccountArgs>}
  \*/

// ============================================
// DnsRecords.ts Documentation  
// ============================================

/\*\*

- Dynamic provider for managing DNS records in Cloudflare.
-
- Handles complete CRUD operations for DNS records with automatic upsert functionality.
- Features:
- - Automatic creation or update of existing records
- - Intelligent record matching by subdomain and type
- - Automatic cleanup of records no longer in configuration
- - Error recovery and duplicate handling
- - Support for all major DNS record types (A, AAAA, CNAME, TXT, MX, NS, SRV, CAA)
-
- @class
- @extends {BaseProvider<DnsRecordsInputs, DnsRecordsOutputs>}
  \*/

/\*\*

- Dynamic resource for managing DNS records.
-
- Wraps the DnsRecordsProvider to provide a Pulumi resource interface
- for declarative DNS record management. Automatically tracks and manages
- multiple DNS records across Cloudflare zones.
-
- @class
- @extends {BaseResource<DnsRecordsInputs, DnsRecordsOutputs>}
  \*/

// ============================================
// OriginCert.ts Documentation
// ============================================

/\*\*

- Dynamic provider for managing Cloudflare Origin CA certificates.
-
- Retrieves existing origin certificates from Cloudflare or creates new ones.
- Automatically checks certificate availability and handles certificate lifecycle.
-
- @class
- @extends {BaseProvider<OriginCertInputs, OriginCertOutputs>}
  \*/

/\*\*

- Dynamic resource for managing Cloudflare Origin CA certificates.
-
- Wraps the OriginCertProvider to provide a Pulumi resource interface
- for managing origin certificates used for mTLS between Cloudflare and origin servers.
-
- @class
- @extends {BaseResource<OriginCertInputs, OriginCertOutputs>}
  \*/

// ============================================
// ZeroTrustConnectivitySettings.ts Documentation
// ============================================

/\*\*

- Dynamic provider for configuring Zero Trust connectivity settings.
-
- Manages ICMP proxy and WARP offramp settings for Zero Trust networks.
- Controls low-level connectivity options for devices connected via WARP.
-
- @class
- @extends {BaseProvider<ZeroTrustConnectivitySettingsInputs, ZeroTrustConnectivitySettingsOutputs>}
  \*/

/\*\*

- Dynamic resource for Zero Trust connectivity settings.
-
- Configures network-level connectivity options for Zero Trust deployments.
-
- @class
- @extends {BaseResource<ZeroTrustConnectivitySettingsInputs, ZeroTrustConnectivitySettingsOutputs>}
  \*/

// ============================================
// ZeroTrustDeviceSettings.ts Documentation
// ============================================

/\*\*

- Dynamic provider for configuring device-level settings in Zero Trust.
-
- Manages WARP client configuration including:
- - Override code bypass duration for temporary access
- - Gateway proxy filtering for TCP and UDP traffic
- - Root certificate installation policies
- - Virtual IPv4 (CGNAT) assignment options
-
- These settings apply to all enrolled devices in the account.
-
- @class
- @extends {BaseProvider<ZeroTrustDeviceSettingsInputs, ZeroTrustDeviceSettingsOutputs>}
  \*/

/\*\*

- Dynamic resource for Zero Trust device settings.
-
- Applies device-level configuration to all WARP-enrolled devices
- in the Zero Trust account.
-
- @class
- @extends {BaseResource<ZeroTrustDeviceSettingsInputs, ZeroTrustDeviceSettingsOutputs>}
  \*/

// ============================================
// ZerotrustAccessWarp.ts Documentation
// ============================================

/\*\*

- Dynamic provider for configuring Zero Trust Access WARP policies.
-
- Manages WARP-specific access policies and maps identity providers
- to WARP enrollment and authentication flows.
-
- @class
- @extends {BaseProvider<ZeroTrustAccessWarpInputs, ZeroTrustAccessWarpOutputs>}
  \*/

/\*\*

- Dynamic resource for Zero Trust WARP access configuration.
-
- Configures which identity providers are available for WARP enrollment
- and device authentication.
-
- @class
- @extends {BaseResource<ZeroTrustAccessWarpInputs, ZeroTrustAccessWarpOutputs>}
  \*/

// ============================================
// ZeroTrustGatewayCertificateActivation.ts Documentation
// ============================================

/\*\*

- Dynamic provider for activating Cloudflare Gateway certificates.
-
- Manages the lifecycle of gateway certificates, handling both
- activation and status tracking throughout the certificate lifecycle.
- Automatically handles re-activation if needed.
-
- @class
- @extends {BaseProvider<ZeroTrustGatewayCertificateActivationInputs, ZeroTrustGatewayCertificateActivationOutputs>}
  \*/

/\*\*

- Dynamic resource for Gateway certificate activation.
-
- Ensures gateway certificates are properly activated and tracks
- their binding status throughout the resource lifecycle.
-
- @class
- @extends {BaseResource<ZeroTrustGatewayCertificateActivationInputs, ZeroTrustGatewayCertificateActivationOutputs>}
  \*/

// ============================================
// IP Address Utilities (ip-bigint.ts) Documentation
// ============================================

/\*\*

- Determines the IP version (IPv4 or IPv6) of an IP address string.
-
- @param {string} ip - IP address to check
- @returns {IPVersion} 4 for IPv4, 6 for IPv6, 0 for invalid IP
  \*/

/\*\*

- Parses an IP address string into a bigint representation.
-
- Supports both IPv4 and IPv6 addresses, including IPv4-mapped IPv6 addresses
- and IPv6 addresses with scope IDs.
-
- @param {string} ip - IP address to parse
- @returns {ParsedIP} Object containing the numeric representation and metadata
- @throws {Error} If the IP address is invalid
  \*/

/\*\*

- Converts a parsed IP back to string representation.
-
- Provides options for compression (IPv6) and hexification.
-
- @param {ParsedIP} parsedIp - The parsed IP object
- @param {StringifyOpts} [opts] - Formatting options
- @returns {string} The IP address as a string
  \*/

// ============================================
// Helper Functions Documentation
// ============================================

/\*\*

- Domain helper for making authenticated requests to Cloudflare API.
-
- Handles authentication and request routing for zone-specific API operations.
- Requires CLOUDFLARE_API_TOKEN and CLOUDFLARE_ZONE_ID environment variables.
-
- @param {string} path - API endpoint path relative to zone
- @param {'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'} method - HTTP method
- @param {any} [body] - Request body for POST/PUT/PATCH
- @returns {Promise<any>} API response data
  \*/

/\*\*

- Account helper for making authenticated requests to Cloudflare account API.
-
- Similar to domainHelper but operates at the account level rather than zone level.
  \*/
