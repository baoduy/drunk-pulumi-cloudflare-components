# Dynamic `cloudflare` Import Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove every value-level static `cloudflare` import; load the SDK lazily via `await import('cloudflare')` centralized in one factory, and keep all type references as erased `import type`.

**Architecture:** The only `new Cloudflare(...)` lives in `getCloudflareClient` (`src/base/helpers.ts`). Make that factory async and dynamic-import the SDK there. Every other file uses cloudflare only as a type → switch to `import type`. Update all `getCloudflareClient()` callers to `await`. Make `CfDomainClient` resolve its client lazily since the factory is now async.

**Tech Stack:** TypeScript, Pulumi dynamic providers (`@pulumi/pulumi`), `cloudflare@^6.4.0` SDK, build via `tsc` (`pnpm build`).

## Global Constraints

- No type cloning into `src/types.ts`. No `package.json` dependency changes.
- After completion, `grep -rn "import Cloudflare from 'cloudflare'" src/` MUST return zero hits. Only `import type Cloudflare from 'cloudflare'` and `await import('cloudflare')` remain.
- Provider runtime behavior must not change beyond async client resolution.
- The verifier for every task is `pnpm build` (tsc typecheck). There is no jest test infra for these providers; do not add one.

---

### Task 1: Make `getCloudflareClient` async + dynamic import

**Files:**
- Modify: `src/base/helpers.ts:2,9-11`

**Interfaces:**
- Produces: `getCloudflareClient: () => Promise<Cloudflare>` (was `() => Cloudflare`). All callers in later tasks must `await` it.

- [ ] **Step 1: Swap value import for type import and make the factory async**

In `src/base/helpers.ts`, change line 2:
```ts
import type Cloudflare from "cloudflare";
```
Change the factory (lines 9-11):
```ts
export const getCloudflareClient = async (): Promise<Cloudflare> => {
    const { default: Cloudflare } = await import("cloudflare");
    return new Cloudflare({
        apiToken: cloudflareApiToken,
    });
};
```
Leave the env-var consts and the validation `throw` block unchanged.

- [ ] **Step 2: Build to confirm callers now break on await**

Run: `pnpm build`
Expected: FAIL — tsc errors at `getCloudflareClient()` call sites (e.g. "Property 'X' does not exist on type 'Promise<Cloudflare>'"). This confirms every caller is reached and must be awaited in Tasks 2-4. Do not commit yet.

---

### Task 2: Await the factory in zeroTrust providers

**Files:**
- Modify: `src/zeroTrust/ZeroTrustPoliciesImport.ts:3,27,75`
- Modify: `src/zeroTrust/ZeroTrustDeviceSettings.ts:37`
- Modify: `src/zeroTrust/ZeroTrustGatewayCertificateActivation.ts:24`

**Interfaces:**
- Consumes: `getCloudflareClient(): Promise<Cloudflare>` from Task 1.

- [ ] **Step 1: `ZeroTrustPoliciesImport.ts` — type import + await (×2)**

Line 3, change `import Cloudflare from 'cloudflare';` to:
```ts
import type Cloudflare from 'cloudflare';
```
Line 27 (in `create`) and line 75 (in `delete`), change `const cf = commonHelpers.getCloudflareClient();` to:
```ts
const cf = await commonHelpers.getCloudflareClient();
```

- [ ] **Step 2: `ZeroTrustDeviceSettings.ts` — await**

Line 37, change `const cf = commonHelpers.getCloudflareClient();` to:
```ts
const cf = await commonHelpers.getCloudflareClient();
```
(Confirm the enclosing method is `async`; all provider methods here are. This file has no top-level `cloudflare` import to change.)

- [ ] **Step 3: `ZeroTrustGatewayCertificateActivation.ts` — await**

Line 24, change `const cf = commonHelpers.getCloudflareClient();` to:
```ts
const cf = await commonHelpers.getCloudflareClient();
```

- [ ] **Step 4: Build**

Run: `pnpm build`
Expected: remaining errors only in `services/*` and `domain/*` (Tasks 3-4). No new errors in `zeroTrust/`.

- [ ] **Step 5: Commit**

```bash
git add src/base/helpers.ts src/zeroTrust/ZeroTrustPoliciesImport.ts src/zeroTrust/ZeroTrustDeviceSettings.ts src/zeroTrust/ZeroTrustGatewayCertificateActivation.ts
git commit -m "refactor: dynamic-import cloudflare in factory + await zeroTrust callers"
```

---

### Task 3: Await the factory + type import in services providers

**Files:**
- Modify: `src/services/TurnstileComponent.ts:3,23,39,54`
- Modify: `src/services/FirewallRuleset.ts:3,33`

**Interfaces:**
- Consumes: `getCloudflareClient(): Promise<Cloudflare>` from Task 1.

- [ ] **Step 1: `TurnstileComponent.ts` — type import + await (×3)**

Line 3, change to:
```ts
import type Cloudflare from 'cloudflare';
```
Lines 23 (`create`), 39 (`update`), 54 (`delete`), change `const client = commonHelpers.getCloudflareClient();` to:
```ts
const client = await commonHelpers.getCloudflareClient();
```

- [ ] **Step 2: `FirewallRuleset.ts` — type import + await**

Line 3, change `import Cloudflare from "cloudflare";` to:
```ts
import type Cloudflare from "cloudflare";
```
Line 33 (`create`), change `const client = commonHelpers.getCloudflareClient();` to:
```ts
const client = await commonHelpers.getCloudflareClient();
```
(The `getOrCreateRuleset(client: Cloudflare, ...)` signature and `Cloudflare.Rulesets.*` type refs are unchanged — they are type positions, valid under `import type`.)

- [ ] **Step 3: Build**

Run: `pnpm build`
Expected: remaining errors only in `domain/CloudflareClient.ts` (Task 4).

- [ ] **Step 4: Commit**

```bash
git add src/services/TurnstileComponent.ts src/services/FirewallRuleset.ts
git commit -m "refactor: type-import cloudflare + await callers in services providers"
```

---

### Task 4: Lazy async client in `CfDomainClient`

**Files:**
- Modify: `src/domain/CloudflareClient.ts:1,22-91`

**Interfaces:**
- Consumes: `getCloudflareClient(): Promise<Cloudflare>` from Task 1.
- Produces: `CfDomainClient` public method signatures unchanged (all already `async`).

- [ ] **Step 1: Type import**

Line 1, change `import Cloudflare from 'cloudflare';` to:
```ts
import type Cloudflare from 'cloudflare';
```

- [ ] **Step 2: Replace eager client with a lazy async accessor**

Change the field declarations and constructor (lines 23-28). Current:
```ts
    private _client: Cloudflare;
    private _zone: Cloudflare.Zones.Zone | undefined;

    constructor(private domain: string) {
        this._client = commonHelpers.getCloudflareClient();
    }
```
Replace with:
```ts
    private _client?: Cloudflare;
    private _zone: Cloudflare.Zones.Zone | undefined;

    constructor(private domain: string) {}

    private async client(): Promise<Cloudflare> {
        return (this._client ??= await commonHelpers.getCloudflareClient());
    }
```

- [ ] **Step 3: Route every `this._client.X` through `await this.client()`**

Replace each `this._client` usage in the method bodies:

`getZone` (line 32):
```ts
        const zones = await (await this.client()).zones.list({match: 'any', name: this.domain});
```
`getUniversalCerts` (line 41):
```ts
        const list = (await this.client()).ssl.certificatePacks.list({zone_id: zone.id});
```
`ensureUniversalCertEnabled` (lines 50, 52):
```ts
        const client = await this.client();
        const status = await client.ssl.universal.settings.get({zone_id: this._zone!.id});
        if (status.enabled) return;
        await client.ssl.universal.settings.edit({zone_id: this._zone!.id, enabled: true});
```
`getMtlsClientCerts` (line 57):
```ts
        const list = (await this.client()).clientCertificates.list({zone_id: zone.id});
```
`createMtlsClientCert` (line 68):
```ts
        return (await this.client()).clientCertificates.create({zone_id: zone.id, validity_days: 10 * 365, csr});
```
`getOriginCerts` (line 73):
```ts
        const list = (await this.client()).originCACertificates.list({zone_id: zone.id});
```
`createOriginCerts` (line 84):
```ts
        return (await this.client()).originCACertificates.create({
            request_type: 'origin-rsa',
            requested_validity: 1095,
            csr,
            hostnames: [`*.${this.domain}`, this.domain, `www.${this.domain}`],
        });
```

- [ ] **Step 4: Build — expect clean**

Run: `pnpm build`
Expected: PASS, no errors.

- [ ] **Step 5: Commit**

```bash
git add src/domain/CloudflareClient.ts
git commit -m "refactor: lazy async cloudflare client in CfDomainClient"
```

---

### Task 5: Final verification gate

**Files:** none (verification only)

- [ ] **Step 1: Confirm zero static value imports remain**

Run: `grep -rn "import Cloudflare from 'cloudflare'" src/`
Expected: no output (exit 1). If any hit remains, fix it (`import type`) before proceeding.

Run: `grep -rn "import Cloudflare from \"cloudflare\"" src/`
Expected: no output.

- [ ] **Step 2: Confirm dynamic import exists exactly where intended**

Run: `grep -rn "await import(\"cloudflare\")\|await import('cloudflare')" src/`
Expected: one hit — `src/base/helpers.ts`.

- [ ] **Step 3: Full build**

Run: `pnpm build`
Expected: PASS, no tsc errors.

- [ ] **Step 4: Run existing test suite**

Run: `pnpm test`
Expected: PASS (or "no tests found" — acceptable; no tests cover these files).
