import http from 'node:http';
import https from 'node:https';
import { URL } from 'node:url';
import tls from 'node:tls';
import { config } from '../config.js';
import { isPrivateOrReservedIP, validateTargetUrl } from './security.service.js';

export interface HttpResponseResult {
  success: boolean;
  finalUrl: string;
  statusCode?: number;
  responseTimeMs: number;
  sslValid: boolean;
  sslDetails?: {
    issuer?: string;
    validTo?: string;
    daysRemaining?: number;
    protocol?: string;
  };
  headers: Record<string, string>;
  securityHeaders: {
    hsts: boolean;
    xContentTypeOptions: boolean;
    xFrameOptions: boolean;
    csp: boolean;
  };
  redirects: Array<{ from: string; to: string; status: number }>;
  html?: string;
  errorMessage?: string;
}

/**
 * Checks SSL certificate for an HTTPS host.
 */
export async function checkSslCertificate(host: string, port = 443): Promise<{ valid: boolean; issuer?: string; validTo?: string; daysRemaining?: number; protocol?: string }> {
  return new Promise(resolve => {
    const socket = tls.connect(
      {
        host,
        port,
        servername: host,
        timeout: 4000,
        rejectUnauthorized: false, // We inspect cert details directly
      },
      () => {
        try {
          const cert = socket.getPeerCertificate();
          const authorized = socket.authorized;
          const protocol = socket.getProtocol() || undefined;

          if (!cert || !cert.valid_to) {
            socket.destroy();
            return resolve({ valid: false });
          }

          const validToDate = new Date(cert.valid_to);
          const now = new Date();
          const daysRemaining = Math.max(0, Math.floor((validToDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

          const valid = authorized && daysRemaining > 0;
          const getFirstOrString = (val: string | string[] | undefined): string | undefined => {
            if (Array.isArray(val)) return val[0];
            return val;
          };
          const issuer = cert.issuer ? (getFirstOrString(cert.issuer.O) || getFirstOrString(cert.issuer.CN) || 'Inconnu') : undefined;

          socket.destroy();
          resolve({
            valid,
            issuer,
            validTo: cert.valid_to,
            daysRemaining,
            protocol,
          });
        } catch {
          socket.destroy();
          resolve({ valid: false });
        }
      }
    );

    socket.on('timeout', () => {
      socket.destroy();
      resolve({ valid: false });
    });

    socket.on('error', () => {
      socket.destroy();
      resolve({ valid: false });
    });
  });
}

/**
 * Performs a safe HTTP/HTTPS fetch with SSRF & DNS rebinding protection and redirect tracking.
 */
export async function safeFetchHtml(initialUrl: string): Promise<HttpResponseResult> {
  const redirects: Array<{ from: string; to: string; status: number }> = [];
  let currentUrl = initialUrl;
  let redirectCount = 0;
  const startTime = Date.now();

  while (redirectCount <= config.audit.maxRedirects) {
    // 1. SSRF Validation for the current URL (at every step)
    const validation = await validateTargetUrl(currentUrl);
    if (!validation.valid || !validation.target) {
      return {
        success: false,
        finalUrl: currentUrl,
        responseTimeMs: Date.now() - startTime,
        sslValid: false,
        headers: {},
        securityHeaders: { hsts: false, xContentTypeOptions: false, xFrameOptions: false, csp: false },
        redirects,
        errorMessage: validation.error || "URL cible invalide ou non sécurisée.",
      };
    }

    const { parsedUrl } = validation.target;
    const isHttps = parsedUrl.protocol === 'https:';
    const requestModule = isHttps ? https : http;

    try {
      const stepResult = await new Promise<{
        statusCode: number;
        headers: http.IncomingHttpHeaders;
        body: string;
        redirectLocation?: string;
        socketIp?: string;
      }>((resolve, reject) => {
        let isAborted = false;
        let responseData = '';
        let bytesReceived = 0;

        const req = requestModule.request(
          parsedUrl,
          {
            method: 'GET',
            headers: {
              'User-Agent': config.audit.userAgent,
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
              'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
              'Connection': 'close',
            },
            timeout: config.audit.maxTimeoutMs,
          },
          res => {
            const statusCode = res.statusCode || 0;
            const headers = res.headers;

            // Check for redirection
            if ([301, 302, 303, 307, 308].includes(statusCode) && headers.location) {
              res.resume(); // Discard body
              return resolve({
                statusCode,
                headers,
                body: '',
                redirectLocation: headers.location,
              });
            }

            res.setEncoding('utf8');

            res.on('data', chunk => {
              if (isAborted) return;
              bytesReceived += Buffer.byteLength(chunk, 'utf8');
              if (bytesReceived > config.audit.maxPayloadSizeBytes) {
                isAborted = true;
                req.destroy();
                return reject(new Error('La page dépasse la taille maximale autorisée (2.5 Mo).'));
              }
              responseData += chunk;
            });

            res.on('end', () => {
              if (!isAborted) {
                resolve({ statusCode, headers, body: responseData });
              }
            });
          }
        );

        // Anti-DNS Rebinding: Verify the actual remote IP on socket connection
        req.on('socket', socket => {
          socket.on('connect', () => {
            const remoteIp = socket.remoteAddress;
            if (remoteIp && isPrivateOrReservedIP(remoteIp)) {
              isAborted = true;
              req.destroy();
              reject(new Error("Connexion bloquée : tentative d'accès à une IP privée ou réservée."));
            }
          });
        });

        req.on('timeout', () => {
          req.destroy();
          reject(new Error("Délai d'attente dépassé (le site met plus de 9 secondes à répondre)."));
        });

        req.on('error', err => {
          reject(err);
        });

        req.end();
      });

      // Handle redirect
      if (stepResult.redirectLocation) {
        redirectCount++;
        const nextUrl = new URL(stepResult.redirectLocation, currentUrl).toString();
        redirects.push({
          from: currentUrl,
          to: nextUrl,
          status: stepResult.statusCode,
        });

        if (redirectCount > config.audit.maxRedirects) {
          return {
            success: false,
            finalUrl: currentUrl,
            responseTimeMs: Date.now() - startTime,
            sslValid: false,
            headers: {},
            securityHeaders: { hsts: false, xContentTypeOptions: false, xFrameOptions: false, csp: false },
            redirects,
            errorMessage: 'Nombre maximal de redirections dépassé (boucle de redirection probable).',
          };
        }

        currentUrl = nextUrl;
        continue; // Next loop iteration
      }

      // Successful final response
      const totalTimeMs = Date.now() - startTime;
      const headersMap: Record<string, string> = {};
      for (const [k, v] of Object.entries(stepResult.headers)) {
        if (v) headersMap[k.toLowerCase()] = Array.isArray(v) ? v.join(', ') : v;
      }

      // Inspect security headers
      const securityHeaders = {
        hsts: !!headersMap['strict-transport-security'],
        xContentTypeOptions: headersMap['x-content-type-options'] === 'nosniff',
        xFrameOptions: !!headersMap['x-frame-options'],
        csp: !!headersMap['content-security-policy'],
      };

      // SSL details check if final url is HTTPS
      let sslValid = false;
      let sslDetails = undefined;
      if (parsedUrl.protocol === 'https:') {
        const sslRes = await checkSslCertificate(parsedUrl.hostname, parsedUrl.port ? parseInt(parsedUrl.port, 10) : 443);
        sslValid = sslRes.valid;
        sslDetails = sslRes;
      }

      return {
        success: stepResult.statusCode >= 200 && stepResult.statusCode < 400,
        finalUrl: currentUrl,
        statusCode: stepResult.statusCode,
        responseTimeMs: totalTimeMs,
        sslValid,
        sslDetails,
        headers: headersMap,
        securityHeaders,
        redirects,
        html: stepResult.body,
      };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      return {
        success: false,
        finalUrl: currentUrl,
        responseTimeMs: Date.now() - startTime,
        sslValid: false,
        headers: {},
        securityHeaders: { hsts: false, xContentTypeOptions: false, xFrameOptions: false, csp: false },
        redirects,
        errorMessage: errorMsg,
      };
    }
  }

  return {
    success: false,
    finalUrl: currentUrl,
    responseTimeMs: Date.now() - startTime,
    sslValid: false,
    headers: {},
    securityHeaders: { hsts: false, xContentTypeOptions: false, xFrameOptions: false, csp: false },
    redirects,
    errorMessage: 'Nombre maximal de redirections dépassé.',
  };
}
