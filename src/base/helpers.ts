import * as process from "node:process";

export const cloudflareAccountId = process.env.CLOUDFLARE_ACCOUNT_ID!;
export const cloudflareApiToken = process.env.CLOUDFLARE_API_TOKEN!;
export const cloudflareZoneId = process.env.CLOUDFLARE_ZONE_ID!;
export const cloudflareApiBaseUrl = process.env.CLOUDFLARE_API_BASE_URL || "https://api.cloudflare.com/client/v4";

const loadCloudflare = () => import("cloudflare");

// Instance type derived from the dynamic import itself, so it shares the same
// module-resolution mode as the runtime `await loadCloudflare()` below. A static
// `import type Cloudflare` would resolve under a different mode and be treated as
// a nominally-incompatible class (the SDK client has a private brand).
export type CloudflareApi = InstanceType<Awaited<ReturnType<typeof loadCloudflare>>["default"]>;

export const getCloudflareClient = async (): Promise<CloudflareApi> => {
    const { default: Cloudflare } = await loadCloudflare();
    return new Cloudflare({
        apiToken: cloudflareApiToken,
    });
};

if (!cloudflareAccountId || !cloudflareApiToken || !cloudflareZoneId) {
    throw new Error("Missing required Cloudflare environment variables.");
}