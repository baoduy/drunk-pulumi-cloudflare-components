import * as process from "node:process";

export const cloudflareAccountId = process.env.CLOUDFLARE_ACCOUNT_ID!;
export const cloudflareApiToken = process.env.CLOUDFLARE_API_TOKEN!;
export const cloudflareZoneId = process.env.CLOUDFLARE_ZONE_ID!;
export const cloudflareApiBaseUrl = process.env.CLOUDFLARE_API_BASE_URL || "https://api.cloudflare.com/client/v4";

export const getCloudflareClient = async (): Promise<any> => {
    const { default: Cloudflare } = await import("cloudflare");
    return new Cloudflare({
        apiToken: cloudflareApiToken,
    });
};

if (!cloudflareAccountId || !cloudflareApiToken || !cloudflareZoneId) {
    throw new Error("Missing required Cloudflare environment variables.");
}