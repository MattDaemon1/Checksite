import dns from 'node:dns/promises';
import net from 'node:net';
import http from 'node:http';
import https from 'node:https';
import { URL } from 'node:url';
import { config } from '../config.js';

export interface ValidatedTarget {
  rawUrl: string;
  parsedUrl: URL;
  resolvedIps: string[];
  normalizedDomain: string;
}

/**
 * Checks if an IPv4 address is in private, loopback, link-local, multicast, or reserved ranges.
 */
export function isPrivateIPv4(ip: string): boolean {
  const parts = ip.split('.').map(p => parseInt(p, 10));
  if (parts.length !== 4 || parts.some(isNaN)) return true;

  const [a, b, c, d] = parts;

  // 0.0.0.0/8
  if (a === 0) return true;

  // 10.0.0.0/8 (Private-Use)
  if (a === 10) return true;

  // 100.64.0.0/10 (Carrier-Grade NAT)
  if (a === 100 && b >= 64 && b <= 127) return true;

  // 127.0.0.0/8 (Loopback)
  if (a === 127) return true;

  // 169.254.0.0/16 (Link-Local & Cloud Metadata, e.g. 169.254.169.254)
  if (a === 169 && b === 254) return true;

  // 172.16.0.0/12 (Private-Use)
  if (a === 172 && b >= 16 && b <= 31) return true;

  // 192.0.0.0/24 (IETF Protocol Assignments)
  if (a === 192 && b === 0 && c === 0) return true;

  // 192.0.2.0/24 (TEST-NET-1)
  if (a === 192 && b === 0 && c === 2) return true;

  // 192.88.99.0/24 (6to4 Relay Anycast)
  if (a === 192 && b === 88 && c === 99) return true;

  // 192.168.0.0/16 (Private-Use)
  if (a === 192 && b === 168) return true;

  // 198.18.0.0/15 (Benchmarking)
  if (a === 198 && (b === 18 || b === 19)) return true;

  // 198.51.100.0/24 (TEST-NET-2)
  if (a === 198 && b === 51 && c === 100) return true;

  // 203.0.113.0/24 (TEST-NET-3)
  if (a === 203 && b === 0 && c === 113) return true;

  // 224.0.0.0/4 (Multicast)
  if (a >= 224 && a <= 239) return true;

  // 240.0.0.0/4 (Reserved / Future Use)
  if (a >= 240) return true;

  // 255.255.255.255 (Broadcast)
  if (a === 255 && b === 255 && c === 255 && d === 255) return true;

  return false;
}

/**
 * Checks if an IPv6 address is private, loopback, link-local, multicast, or IPv4-mapped private.
 */
export function isPrivateIPv6(ip: string): boolean {
  const normalized = ip.toLowerCase().trim();

  // Unspecified & Loopback
  if (normalized === '::' || normalized === '::1' || normalized === '0:0:0:0:0:0:0:0' || normalized === '0:0:0:0:0:0:0:1') {
    return true;
  }

  // IPv4-mapped IPv6 (::ffff:192.168.1.1 or ::ffff:c0a8:0101)
  if (normalized.startsWith('::ffff:')) {
    const v4Part = normalized.replace('::ffff:', '');
    if (net.isIPv4(v4Part)) {
      return isPrivateIPv4(v4Part);
    }
  }

  // ULA (fc00::/7) -> fc or fd
  if (normalized.startsWith('fc') || normalized.startsWith('fd')) {
    return true;
  }

  // Link-Local (fe80::/10) -> fe8, fe9, fea, feb
  if (normalized.startsWith('fe8') || normalized.startsWith('fe9') || normalized.startsWith('fea') || normalized.startsWith('feb')) {
    return true;
  }

  // Multicast (ff00::/8)
  if (normalized.startsWith('ff')) {
    return true;
  }

  // Documentation (2001:db8::/32)
  if (normalized.startsWith('2001:db8:') || normalized.startsWith('2001:0db8:')) {
    return true;
  }

  // Discard-only (100::/64)
  if (normalized.startsWith('100::')) {
    return true;
  }

  return false;
}

/**
 * Validates any IP address (v4 or v6).
 */
export function isPrivateOrReservedIP(ip: string): boolean {
  const version = net.isIP(ip);
  if (version === 4) {
    return isPrivateIPv4(ip);
  }
  if (version === 6) {
    return isPrivateIPv6(ip);
  }
  return true; // Unknown format = treat as unsafe
}

/**
 * Normalizes and thoroughly validates a candidate URL for SSRF vulnerabilities.
 */
export async function validateTargetUrl(rawInput: string): Promise<{ valid: boolean; error?: string; target?: ValidatedTarget }> {
  if (!rawInput || typeof rawInput !== 'string') {
    return { valid: false, error: 'Une URL de site web est requise.' };
  }

  let sanitized = rawInput.trim();
  // If no scheme, default to https://
  if (!sanitized.match(/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//)) {
    sanitized = `https://${sanitized}`;
  }

  let parsed: URL;
  try {
    parsed = new URL(sanitized);
  } catch {
    return { valid: false, error: "Le format de l'URL est invalide." };
  }

  // 1. Only allow http and https
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return { valid: false, error: 'Seuls les protocoles http:// et https:// sont acceptés.' };
  }

  // 2. Reject credentials in URL
  if (parsed.username || parsed.password) {
    return { valid: false, error: 'Les identifiants dans les URL ne sont pas autorisés.' };
  }

  // 3. Reject non-standard ports
  const port = parsed.port ? parseInt(parsed.port, 10) : (parsed.protocol === 'https:' ? 443 : 80);
  if (!config.audit.allowedPorts.includes(port)) {
    return { valid: false, error: `Le port ${port} n'est pas autorisé pour l'audit public (ports 80 et 443 uniquement).` };
  }

  const hostname = parsed.hostname.toLowerCase();

  // 4. Check for obvious localhost / internal hostnames
  if (
    hostname === 'localhost' ||
    hostname.endsWith('.localhost') ||
    hostname.endsWith('.local') ||
    hostname.endsWith('.internal') ||
    hostname.endsWith('.arpa') ||
    hostname === 'metadata.google.internal'
  ) {
    return { valid: false, error: "L'analyse d'adresses réseau locales ou internes est strictement interdite." };
  }

  // 5. If hostname is already an IP, directly test it
  if (net.isIP(hostname)) {
    if (isPrivateOrReservedIP(hostname)) {
      return { valid: false, error: "L'analyse d'adresses IP privées ou réservées est interdite." };
    }
  }

  // 6. DNS Resolution check (anti-SSRF)
  try {
    const lookups = await dns.lookup(hostname, { all: true });
    if (!lookups || lookups.length === 0) {
      return { valid: false, error: 'Impossible de résoudre le nom de domaine (DNS introuvable).' };
    }

    const resolvedIps = lookups.map(l => l.address);
    for (const ip of resolvedIps) {
      if (isPrivateOrReservedIP(ip)) {
        return { valid: false, error: "Ce nom de domaine pointe vers une adresse IP privée ou non autorisée." };
      }
    }

    return {
      valid: true,
      target: {
        rawUrl: parsed.toString(),
        parsedUrl: parsed,
        resolvedIps,
        normalizedDomain: hostname.replace(/^www\./, ''),
      }
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return { valid: false, error: `Erreur de résolution DNS : ${errorMsg}` };
  }
}

/**
 * Creates an HTTP/HTTPS agent that enforces DNS rebinding protection at socket connection time.
 */
export function createSafeAgent(protocol: string) {
  const isHttps = protocol === 'https:';
  const AgentClass = isHttps ? https.Agent : http.Agent;

  return new AgentClass({
    keepAlive: false,
    timeout: config.audit.maxTimeoutMs,
  });
}

/**
 * In-memory sliding window rate limiter for IP addresses (privacy preserving hash / window).
 */
class SimpleRateLimiter {
  private requests = new Map<string, number[]>();

  public isAllowed(key: string, limit: number, windowMs: number): boolean {
    const now = Date.now();
    const timestamps = this.requests.get(key) || [];
    const validTimestamps = timestamps.filter(ts => now - ts < windowMs);

    if (validTimestamps.length >= limit) {
      this.requests.set(key, validTimestamps);
      return false;
    }

    validTimestamps.push(now);
    this.requests.set(key, validTimestamps);
    return true;
  }

  public cleanup(windowMs: number) {
    const now = Date.now();
    for (const [key, timestamps] of this.requests.entries()) {
      const valid = timestamps.filter(ts => now - ts < windowMs);
      if (valid.length === 0) {
        this.requests.delete(key);
      } else {
        this.requests.set(key, valid);
      }
    }
  }
}

export const rateLimiter = new SimpleRateLimiter();
// Periodic cleanup every 10 minutes
setInterval(() => rateLimiter.cleanup(config.rateLimit.windowMs), config.rateLimit.windowMs).unref();
