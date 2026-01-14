export const allowsSpecificIPsRule = (domain: string, ipAddresses: string[]) => ({expression: `(not ip.src in {${ipAddresses.join(' ')}} and http.host eq "${domain}")`});

export const rateLimitsRule = (path: string, allowsRequestPerSecond: number = 10) => ({
    expression: `(http.request.uri.path contains "${path}")`,
    ratelimit: {
        "characteristics": [
            "ip.src",
            "cf.colo.id"
        ],
        "requests_to_origin": false,
        "requests_per_period": allowsRequestPerSecond * 10,
        "period": 10,
        "mitigation_timeout": 10
    },
});