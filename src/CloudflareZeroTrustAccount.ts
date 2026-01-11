import { BaseComponent } from './base';
import * as pulumi from '@pulumi/pulumi';
import * as cf from '@pulumi/cloudflare';
import {
  AppRegistration,
  AzRole,
  createCloudflareAzIdentity,
  RandomPassword,
  VaultSecret,
} from '@drunk-pulumi/azure-components';
import * as types from './types';
import {
  ZeroTrustDeviceSettingsResource,
  ZeroTrustGatewayCertificateActivationResource,
  ZeroTrustPrivateApplication,
  ZeroTrustPrivateApplicationArgs,
} from './zeroTrust';
import * as cidrTools from './cidr-tools';
import { ZeroTrustAccessWarpResource } from './zeroTrust/ZerotrustAccessWarp';
import { accountHelper } from './helpers';

import { ZeroTrustConnectivitySettingsResource } from './zeroTrust/ZerotrustConnectivitySettings';

type PrivateAppType = Omit<ZeroTrustPrivateApplicationArgs, 'tunnelId' | 'virtualNetworkId' | 'policies'> & {
  policies?: {
    requiredSso?: boolean;
    requiredDevicePosture?: boolean;
    groupIds?: pulumi.Input<string>[];
  };
};

type TunnelArgs = Required<types.WithName> & {
  configSrc?: 'local' | 'cloudflare';
  privateApps?: PrivateAppType[];
};

export interface CloudflareZeroTrustAccountArgs extends types.WithVaultInfo {
  organization?: Partial<Omit<cf.ZeroTrustOrganizationArgs, 'accountId' | 'zoneId' | 'authDomain' | 'name'>> & {
    name: string;
  };
  enableAzIdentity?: boolean;
  enableDeviceIntuneIntegration?: boolean;
  gatewaySettings?: Partial<Pick<cf.ZeroTrustGatewaySettingsArgs, 'settings'>>;
  deviceSettings?: Partial<Omit<cf.ZeroTrustDeviceSettingsArgs, 'accountId' | 'zoneId'>>;
  deviceProfiles?: Partial<
    Omit<cf.ZeroTrustDeviceDefaultProfileArgs, 'accountId' | 'zoneId' | 'excludes' | 'includes'>
  > & {
    localIncludesIpAddressSpaces?: string[];
    allowedDevicePlatforms?: ('windows' | 'mac' | 'linux' | 'android' | 'ios' | 'chromeos')[];
  };
  tunnels?: Array<TunnelArgs>;
}

type TunnelOutputType = { id: pulumi.Output<string>; vaultSecretName: string };
type DevicesPostureRulesType = {
  warp: cf.ZeroTrustDevicePostureRule;
  gateway: cf.ZeroTrustDevicePostureRule;
  intune?: cf.ZeroTrustDevicePostureRule;
};

export class CloudflareZeroTrustAccount extends BaseComponent<CloudflareZeroTrustAccountArgs> {
  public readonly organization?: cf.ZeroTrustOrganization;
  public readonly identityProvider?: cf.ZeroTrustAccessIdentityProvider;
  public readonly onboardingGroup?: AzRole;
  public readonly devicesPostureRules?: DevicesPostureRulesType;
  public readonly ssoPolicy?: cf.ZeroTrustAccessPolicy;
  public readonly deviceEnrollmentPolicy?: cf.ZeroTrustAccessPolicy;
  public readonly devicePosturePolicy?: cf.ZeroTrustAccessPolicy;
  public readonly defaultTunnelNetwork?: cf.ZeroTrustTunnelCloudflaredVirtualNetwork;
  public readonly tunnels?: Record<string, TunnelOutputType>;

  constructor(name: string, args: CloudflareZeroTrustAccountArgs, opts?: pulumi.ComponentResourceOptions) {
    super('CloudflareAccount', name, args, opts);

    this.organization = this.createOrganization();
    this.createGatewaySettings();
    this.createDevicesSettings();
    this.createDeviceProfiles();

    const azIdentity = this.createAzIdentity();
    if (azIdentity) {
      const rs = this.createIdentityProvider(azIdentity);
      this.identityProvider = rs?.identityProvider;
      this.ssoPolicy = rs?.ssoPolicy;

      const intuneIntegration = this.createIntuneIntegration(azIdentity);
      this.devicesPostureRules = this.createDevicePostureRules(intuneIntegration);
      this.devicePosturePolicy = this.createDevicePosturePolicy(this.devicesPostureRules, this.identityProvider!);
    }

    if (this.identityProvider) {
      const { groupRole, deviceEnrollmentPolicy } = this.createDeviceEnrollmentPolicy(this.identityProvider);
      this.onboardingGroup = groupRole;
      this.deviceEnrollmentPolicy = deviceEnrollmentPolicy;
    }

    if (this.args.tunnels) {
      const { defaultNetwork, tunnels } = this.createTunnels()!;
      this.defaultTunnelNetwork = defaultNetwork;
      this.tunnels = tunnels;
    }
    this.registerOutputs();
  }

  public getOutputs() {
    return {
      organization: this.organization
        ? {
            id: this.organization.id,
            resourceName: this.organization.name,
          }
        : undefined,
      identityProvider: this.identityProvider
        ? { id: this.identityProvider.id, resourceName: this.identityProvider.name }
        : undefined,
      onboardingGroup: this.onboardingGroup?.getOutputs(),
      deviceEnrollmentPolicy: this.deviceEnrollmentPolicy
        ? { id: this.deviceEnrollmentPolicy.id, resourceName: this.deviceEnrollmentPolicy.name }
        : undefined,
      defaultTunnelNetwork: this.defaultTunnelNetwork
        ? { id: this.defaultTunnelNetwork.id, resourceName: this.defaultTunnelNetwork.name }
        : undefined,
      tunnels: this.tunnels,
    };
  }

  private createOrganization() {
    const { organization } = this.args;
    if (!organization) return;

    return new cf.ZeroTrustOrganization(
      `${this.name}-org`,
      {
        accountId: this.accountId,
        //default values but allows to be overwritten
        allowAuthenticateViaWarp: true,
        autoRedirectToIdentity: true,
        isUiReadOnly: false,
        sessionDuration: '8h',
        warpAuthSessionDuration: '24h',
        userSeatExpirationInactiveTime: '730h',
        //overrides
        ...organization,
        authDomain: `${organization.name}.cloudflareaccess.com`,
      },
      { ...this.opts, parent: this, retainOnDelete: true },
    );
  }

  private createAzIdentity() {
    const { organization, enableAzIdentity, vaultInfo } = this.args;
    if (!enableAzIdentity || !organization) return undefined;
    return createCloudflareAzIdentity(
      organization.name,
      { vaultInfo },
      { dependsOn: this.opts?.dependsOn, parent: this },
    );
  }

  private createIdentityProvider(identity: AppRegistration) {
    const { organization, enableAzIdentity } = this.args;
    if (!enableAzIdentity || !organization) return undefined;

    const identityProvider = new cf.ZeroTrustAccessIdentityProvider(
      `${this.name}-entraID-idp`,
      {
        name: 'EntraID Identity Provider',
        accountId: this.accountId,
        type: 'azureAD',
        config: {
          clientId: identity.clientId,
          clientSecret: identity.clientSecret,
          directoryId: identity.tenantId,
          pkceEnabled: true,
          supportGroups: true,
        },
        scimConfig: {
          enabled: true,
          identityUpdateBehavior: 'automatic',
          userDeprovision: true,
          seatDeprovision: true,
        },
      },
      { dependsOn: identity, parent: this, retainOnDelete: true },
    );

    const ssoPolicy = new cf.ZeroTrustAccessPolicy(
      `${this.name}-sso-policy`,
      {
        accountId: this.accountId!,
        name: 'Require SSO Policy',
        decision: 'allow',
        approvalRequired: false,
        includes: [{ loginMethod: { id: identityProvider.id } }],
        requires: [{ loginMethod: { id: identityProvider.id } }],
      },
      { dependsOn: identityProvider, parent: this, deletedWith: identityProvider },
    );

    return { identityProvider, ssoPolicy };
  }

  private createGatewayCertificate() {
    const cert = new cf.ZeroTrustGatewayCertificate(
      `${this.name}-gateway-cert`,
      {
        accountId: this.accountId!,
        activate: true,
        validityPeriodDays: 1825,
      },
      { parent: this, retainOnDelete: true },
    );

    new ZeroTrustGatewayCertificateActivationResource(
      `${this.name}-gateway-cert-activation`,
      {
        accountId: this.accountId!,
        certificateId: cert.id,
      },
      { parent: this, dependsOn: cert, retainOnDelete: true },
    );

    return cert;
  }

  private createGatewaySettings() {
    const { gatewaySettings } = this.args;

    const cert = this.createGatewayCertificate();

    const settings = new cf.ZeroTrustGatewaySettings(
      `${this.name}-gateway-settings`,
      {
        accountId: this.accountId!,
        settings: {
          activityLog: { enabled: true },
          certificate: { id: cert.id },
          antivirus: {
            enabledDownloadPhase: true,
            enabledUploadPhase: true,
            failClosed: false,
            notificationSettings: { enabled: true },
          },
          bodyScanning: { inspectionMode: 'shallow' },
          //browserIsolation:{nonIdentityEnabled:false,urlBrowserIsolationEnabled:true},
          inspection: { mode: 'dynamic' },
          protocolDetection: { enabled: true },
          ...gatewaySettings,
        },
      },
      { dependsOn: cert, parent: this, retainOnDelete: true },
    );

    new ZeroTrustConnectivitySettingsResource(
      `${this.name}-connectivity-settings`,
      {
        accountId: this.accountId!,
        icmpProxyEnabled: true,
      },
      { parent: this },
    );

    new cf.ZeroTrustGatewayLogging(
      `${this.name}-gateway-logging`,
      {
        accountId: this.accountId!,
        redactPii: true,
        settingsByRuleType: {
          dns: { logAll: false, logBlocks: true },
          http: { logAll: false, logBlocks: true },
          l4: { logAll: true, logBlocks: false },
        },
      },
      { dependsOn: settings, parent: this, retainOnDelete: true },
    );
  }

  private createDevicesSettings() {
    const { deviceSettings } = this.args;
    new ZeroTrustDeviceSettingsResource(
      `${this.name}-devices-settings`,
      {
        accountId: this.accountId!,
        disableForTime: 3600,
        gatewayProxyEnabled: true,
        gatewayUdpProxyEnabled: true,
        rootCertificateInstallationEnabled: true,
        useZtVirtualIp: false,
        ...deviceSettings,
      },
      { parent: this, retainOnDelete: true },
    );
  }

  private calculateExcludeIpaddressSpaces() {
    const { deviceProfiles } = this.args;
    if (!deviceProfiles?.localIncludesIpAddressSpaces) return ['172.16.0.0/12', '192.168.0.0/16', '10.0.0.0/8'];
    const localExcludes = deviceProfiles.localIncludesIpAddressSpaces;

    // Group excludes by IP prefix
    const group10 = localExcludes.filter((ip) => ip.startsWith('10.'));
    const group172 = localExcludes.filter((ip) => ip.startsWith('172.'));
    const group192 = localExcludes.filter((ip) => ip.startsWith('192.'));

    // Call excludeCidr for each base space
    const excludes10 = group10.length > 0 ? cidrTools.excludeCidr('10.0.0.0/8', group10) : ['10.0.0.0/8'];
    const excludes172 = group172.length > 0 ? cidrTools.excludeCidr('172.16.0.0/12', group172) : ['172.16.0.0/12'];
    const excludes192 = group192.length > 0 ? cidrTools.excludeCidr('192.168.0.0/16', group192) : ['192.168.0.0/16'];

    // Combine and return results
    return [...excludes10, ...excludes172, ...excludes192];
  }

  private createDeviceProfiles() {
    const { deviceProfiles } = this.args;
    const excludeLocalIps = this.calculateExcludeIpaddressSpaces();

    new cf.ZeroTrustDeviceDefaultProfile(
      `${this.name}-devices-default-profile`,
      {
        accountId: this.accountId!,
        allowedToLeave: false,
        allowModeSwitch: false,
        allowUpdates: true,
        autoConnect: 900, //15 minutes
        captivePortal: 180, //3 minutes
        excludeOfficeIps: true,
        switchLocked: true,
        tunnelProtocol: 'masque',
        disableAutoFallback: true,
        registerInterfaceIpWithDns: true,
        serviceModeV2: { mode: 'warp' },
        excludes: [
          ...excludeLocalIps.map((address) => ({ address: address, description: 'Local Ip Addresses' })),
          {
            address: '100.64.0.0/10',
          },
          {
            address: '169.254.0.0/16',
            description: 'DHCP Unspecified',
          },
          {
            address: '192.0.0.0/24',
          },
          {
            address: '224.0.0.0/24',
          },
          {
            address: '240.0.0.0/4',
          },
          {
            address: '255.255.255.255/32',
            description: 'DHCP Broadcast',
          },
          {
            address: 'fe80::/10',
            description: 'IPv6 Link Local',
          },
          {
            address: 'fd00::/8',
          },
          {
            address: 'ff01::/16',
          },
          {
            address: 'ff02::/16',
          },
          {
            address: 'ff03::/16',
          },
          {
            address: 'ff04::/16',
          },
          {
            address: 'ff05::/16',
          },
        ],
        ...deviceProfiles,
      },
      { parent: this, retainOnDelete: true },
    );
  }

  private createDeviceEnrollmentPolicy(identityProvider: cf.ZeroTrustAccessIdentityProvider) {
    const groupRole = new AzRole(
      `${this.name}-onboarding`,
      {
        preventDuplicateNames: true,
      },
      { dependsOn: identityProvider, parent: this },
    );

    const deviceEnrollmentPolicy = new cf.ZeroTrustAccessPolicy(
      `${this.name}-device-enrollment-policy`,
      {
        accountId: this.accountId!,
        name: 'Device Enrollment Policy',
        decision: 'allow',
        approvalRequired: false,
        includes: [{ loginMethod: { id: identityProvider.id } }],
        requires: [
          {
            azureAd: { identityProviderId: identityProvider.id, id: groupRole.objectId },
          },
        ],
      },
      { dependsOn: [identityProvider, groupRole], parent: this, retainOnDelete: true },
    );

    new ZeroTrustAccessWarpResource(
      `${this.name}-access-warp`,
      { accountId: this.accountId!, allowedIdps: [identityProvider.id], policies: [deviceEnrollmentPolicy.id] },
      { dependsOn: [deviceEnrollmentPolicy, identityProvider], parent: this, retainOnDelete: true },
    );

    return { groupRole, deviceEnrollmentPolicy };
  }

  private createIntuneIntegration(identity: AppRegistration) {
    const { enableDeviceIntuneIntegration } = this.args;
    if (!enableDeviceIntuneIntegration) return undefined;

    return new cf.ZeroTrustDevicePostureIntegration(
      `${this.name}-intune-integration`,
      {
        accountId: this.accountId!,
        name: 'Intune Integration',
        interval: '4h',
        type: 'intune',
        config: {
          clientId: identity.clientId,
          clientSecret: identity.clientSecret,
          customerId: identity.tenantId,
          authUrl: 'https://login.microsoftonline.com',
          apiUrl: 'https://graph.microsoft.com',
        },
      },
      { dependsOn: identity, parent: this },
    );
  }

  private createDevicePostureRules(intune?: cf.ZeroTrustDevicePostureIntegration) {
    const gateway = new cf.ZeroTrustDevicePostureRule(
      `${this.name}-device-gateway-posture`,
      {
        accountId: this.accountId!,
        name: 'device-gateway-posture',
        description: 'device posture rule for gateway connected devices',
        expiration: '4h',
        type: 'gateway',
      },
      { parent: this, retainOnDelete: true },
    );

    const warp = new cf.ZeroTrustDevicePostureRule(
      `${this.name}-device-warp-posture`,
      {
        accountId: this.accountId!,
        name: 'device-warp-posture',
        description: 'device posture rule for warp connected devices',
        expiration: '4h',
        type: 'warp',
      },
      { parent: this, retainOnDelete: true },
    );

    const devicePlatforms = this.args.deviceProfiles?.allowedDevicePlatforms || ['windows', 'mac'];
    const intuneRule = intune
      ? new cf.ZeroTrustDevicePostureRule(
          `${this.name}-device-intune-posture`,
          {
            accountId: this.accountId!,
            name: 'device-intune-posture',
            description: 'device posture rule for intune compliant devices',
            expiration: '4h',
            type: 'intune',
            input: {
              complianceStatus: 'compliant',
              connectionId: intune.id,
            },
            matches: devicePlatforms.map((f) => ({ platform: f })),
            schedule: '5m',
          },
          { parent: this, retainOnDelete: true },
        )
      : undefined;

    return { warp, gateway, intune: intuneRule };
  }

  private createDevicePosturePolicy(
    devicesPostureRules: DevicesPostureRulesType,
    identityProvider: cf.ZeroTrustAccessIdentityProvider,
  ) {
    return new cf.ZeroTrustAccessPolicy(
      `${this.name}-device-posture-policy`,
      {
        accountId: this.accountId!,
        name: 'Device Posture Policy',
        decision: 'allow',
        approvalRequired: false,
        includes: [{ loginMethod: { id: identityProvider.id } }],
        requires: Object.values(devicesPostureRules).map((d) => ({ devicePosture: { integrationUid: d.id } })),
      },
      { dependsOn: Object.values(devicesPostureRules), parent: this, retainOnDelete: true },
    );
  }

  private createVnet(name: string, description?: string, isDefault?: boolean) {
    return new cf.ZeroTrustTunnelCloudflaredVirtualNetwork(
      `${this.name}-${name}-network`,
      {
        accountId: this.accountId!,
        name: `${name}-network`,
        comment: description,
        isDefaultNetwork: isDefault,
      },
      { parent: this },
    );
  }

  private createPrivateApp({
    name,
    policies,
    defaultVnet,
    tunnel,
    ...others
  }: PrivateAppType & {
    defaultVnet: cf.ZeroTrustTunnelCloudflaredVirtualNetwork;
    tunnel: cf.ZeroTrustTunnelCloudflared;
  }) {
    const policyIds: pulumi.Input<string>[] = [];

    if (policies?.requiredDevicePosture && this.devicePosturePolicy) policyIds.push(this.devicePosturePolicy.id);
    if (policies?.requiredSso && this.ssoPolicy) policyIds.push(this.ssoPolicy.id);

    if (policies?.groupIds && policies.groupIds.length > 0 && this.identityProvider) {
      const appPolicy = new cf.ZeroTrustAccessPolicy(
        `${this.name}-${name.replace(/\s+/g, '').toLowerCase()}-group-policy`,
        {
          accountId: this.accountId!,
          name: `${name} Group Access Policy`,
          decision: 'allow',
          approvalRequired: false,
          includes: [{ loginMethod: { id: this.identityProvider.id } }],
          requires: policies.groupIds.map((groupId) => ({
            azureAd: {
              identityProviderId: this.identityProvider!.id,
              id: groupId,
            },
          })),
        },
        { dependsOn: this.identityProvider, parent: this, retainOnDelete: true },
      );
      policyIds.push(appPolicy.id);
    }

    return new ZeroTrustPrivateApplication(
      `${this.name}-${name.replace(/\s+/g, '').toLowerCase()}-private-app`,
      {
        name,
        ...others,
        tunnelId: tunnel.id,
        virtualNetworkId: defaultVnet.id,
        policies: policyIds,
      },
      { dependsOn: [tunnel, defaultVnet], parent: this },
    );
  }

  private createTunnel(
    { name, configSrc, privateApps }: TunnelArgs,
    defaultVnet: cf.ZeroTrustTunnelCloudflaredVirtualNetwork,
  ) {
    const { vaultInfo } = this.args;
    const secret = new RandomPassword(
      `${this.name}-${name}-tunnel-secret`,
      {
        length: 100,
        options: { lower: true, numeric: true, special: false, upper: true },
        policy: false,
      },
      { parent: this },
    );

    const tunnel = new cf.ZeroTrustTunnelCloudflared(
      `${this.name}-${name}-tunnel`,
      {
        accountId: this.accountId!,
        name,
        configSrc: configSrc ?? 'cloudflare',
        tunnelSecret: secret.value.apply((v) => Buffer.from(v).toString('base64')),
      },
      { dependsOn: secret, parent: this, deleteBeforeReplace: true, replaceOnChanges: ['tunnelSecret'] },
    );

    //private routes
    if (privateApps) {
      privateApps.forEach((app) => this.createPrivateApp({ ...app, defaultVnet, tunnel }));
    }

    if (vaultInfo) {
      const token = accountHelper.getTunnelTokenOutput(tunnel.id);
      new VaultSecret(
        `${this.name}-${name}-token`,
        {
          vaultInfo,
          value: token,
          contentType: `${name} CloudFlared tunnel token`,
        },
        { parent: this, dependsOn: tunnel, deletedWith: tunnel },
      );
    }

    return { id: tunnel.id, vaultSecretName: `${this.name}-${name}-token` };
  }

  private createTunnels() {
    const { tunnels } = this.args;
    if (!tunnels) return undefined;

    const defaultNetwork = this.createVnet('default', `Virtual Default Network for ${this.name} tunnels`, true);
    const cfTunnels: Record<string, TunnelOutputType> = {};

    for (const t of tunnels) {
      const tunnel = this.createTunnel(t, defaultNetwork);
      cfTunnels[t.name] = { id: tunnel.id, vaultSecretName: `${this.name}-${t.name}-token` };
    }

    return { defaultNetwork, tunnels: cfTunnels };
  }
}
