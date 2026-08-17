import { isIP } from "net";
import { lookup } from "dns/promises";

const PRIVATE_IPV4_RE =
    /^(10\.|127\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|0\.|169\.254\.|100\.(6[4-9]|[7-9]\d)|100\.1\d\d|100\.12[0-8])/;

export function isPrivateIp(ip: string): boolean {
    if (isIP(ip) === 4) {
        if (PRIVATE_IPV4_RE.test(ip)) return true;
        if (ip === "255.255.255.255") return true;
        return false;
    }
    if (isIP(ip) === 6) {
        const lower = ip.toLowerCase();
        return (
            lower.startsWith("::1") ||
            lower.startsWith("fc") ||
            lower.startsWith("fd") ||
            lower.startsWith("fe80:") ||
            lower.startsWith("::ffff:127.") ||
            lower.startsWith("::ffff:10.") ||
            lower.startsWith("::ffff:172.") ||
            lower.startsWith("::ffff:192.168.")
        );
    }
    return false;
}

export async function isPrivateHostname(hostname: string): Promise<boolean> {
    try {
        const addresses = await lookup(hostname, { all: true });
        return addresses.some((addr) => isPrivateIp(addr.address));
    } catch {
        return true;
    }
}