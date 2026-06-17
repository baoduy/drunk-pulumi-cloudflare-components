# Dynamic `cloudflare` Import — Design

Date: 2026-06-17

## Problem

The `cloudflare` SDK is imported statically (`import Cloudflare from 'cloudflare'`) at
module scope in several Pulumi dynamic-provider files. Pulumi dynamic providers serialize
their `create`/`update`/`delete` closures at deploy time; a value-level static import gets
captured by that serialization. Best practice is to resolve the SDK lazily at runtime via
a dynamic `import('cloudflare')` inside the provider methods.

## Goal (decided)

- Eliminate every **value-level** static `cloudflare` import. The SDK is loaded lazily via
  dynamic `import('cloudflare')` at runtime.
- Keep all **type** references via `import type Cloudflare from 'cloudflare'` (fully erased
  at compile time → zero runtime cost, zero serialization weight).
- **No type cloning** into `src/types.ts`. `cloudflare@^6.4.0` is already a runtime
  `dependency`, so consumers install it transitively; the emitted `.d.ts` referencing
  cloudflare types is acceptable. (Cloning would only be needed if `cloudflare` later
  became a `peer`/`optional` dependency.)

## Key observation

Only **one** value-level `new Cloudflare(...)` exists in the codebase:
`getCloudflareClient` in `src/base/helpers.ts`. Every provider obtains its client through
that factory. Centralizing the dynamic import there fixes all call sites in one place.

## Changes

### 1. `src/base/helpers.ts` — the single value site → async dynamic import

```ts
import type Cloudflare from "cloudflare";   // erased at compile time

export const getCloudflareClient = async (): Promise<Cloudflare> => {
    const { default: Cloudflare } = await import("cloudflare");
    return new Cloudflare({ apiToken: cloudflareApiToken });
};
```

The `await import("cloudflare")` runs inside the provider process at runtime, so the SDK is
not captured by Pulumi closure serialization. The return-type annotation uses the erased
type import.

### 2. Type-only imports (`import Cloudflare` → `import type Cloudflare`)

All uses in these files are type positions, so the swap is safe:

- `src/services/TurnstileComponent.ts` — `Cloudflare.Turnstile.WidgetCreateParams`
- `src/services/FirewallRuleset.ts` — `Cloudflare.Rulesets.RulesetCreateParams`,
  `Cloudflare.Rulesets.PhaseGetResponse`, `client: Cloudflare`
- `src/zeroTrust/ZeroTrustPoliciesImport.ts` — `Cloudflare.ZeroTrust.Gateway.RuleCreateParams`
- `src/domain/CloudflareClient.ts` — `_client: Cloudflare`, `_zone: Cloudflare.Zones.Zone`

### 3. `await` the now-async factory at all call sites

All are already inside `async` methods — add `await`:

- `src/zeroTrust/ZeroTrustPoliciesImport.ts` (×2: create, delete)
- `src/zeroTrust/ZeroTrustDeviceSettings.ts`
- `src/zeroTrust/ZeroTrustGatewayCertificateActivation.ts`
- `src/services/TurnstileComponent.ts` (×3: create, update, delete)
- `src/services/FirewallRuleset.ts` (create)

### 4. `src/domain/CloudflareClient.ts` — lazy async client

The constructor currently assigns `this._client` synchronously; the factory is now async.
Make the client lazy:

```ts
private _client?: Cloudflare;

private async client(): Promise<Cloudflare> {
    return (this._client ??= await commonHelpers.getCloudflareClient());
}
```

Replace each `this._client.X` with `(await this.client()).X` in the method bodies.
`OriginCertProvider` is unchanged — it calls `CfDomainClient` methods, which already
`await` internally.

## Out of scope

- No `src/types.ts` cloning.
- No `package.json` dependency changes.
- No behavior changes to provider logic beyond async client resolution.

## Success criteria

- `grep -rn "import Cloudflare from 'cloudflare'" src/` → **zero** hits. Only
  `import type Cloudflare from 'cloudflare'` and `await import('cloudflare')` remain.
- `pnpm build` (tsc) passes — no "value used as type" / "type used as value" errors.
- Every `getCloudflareClient()` caller is awaited.
- Provider runtime behavior unchanged (client resolves the same Cloudflare instance).
