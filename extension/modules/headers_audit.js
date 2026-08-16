// LokiSec - Security Headers & Misconfiguration Evaluator

export function auditSecurityHeaders(headersList = []) {
  const map = {};
  headersList.forEach((h) => {
    map[h.name.toLowerCase()] = h.value;
  });

  const checks = [
    {
      key: "csp",
      name: "Content-Security-Policy",
      present: !!map["content-security-policy"],
      value: map["content-security-policy"] || null,
      severity: map["content-security-policy"] ? "LOW" : "HIGH",
      description: "Controls execution of scripts and restricts unauthorized resources.",
      remediation: "Configure a strict Content-Security-Policy (e.g., default-src 'self')."
    },
    {
      key: "hsts",
      name: "Strict-Transport-Security (HSTS)",
      present: !!map["strict-transport-security"],
      value: map["strict-transport-security"] || null,
      severity: map["strict-transport-security"] ? "LOW" : "HIGH",
      description: "Enforces TLS/HTTPS connections and prevents SSL stripping.",
      remediation: "Add 'Strict-Transport-Security: max-age=31536000; includeSubDomains'."
    },
    {
      key: "xfo",
      name: "X-Frame-Options / Frame-Ancestors",
      present: !!map["x-frame-options"] || (map["content-security-policy"] && map["content-security-policy"].includes("frame-ancestors")),
      value: map["x-frame-options"] || (map["content-security-policy"] ? "Handled via CSP frame-ancestors" : null),
      severity: (map["x-frame-options"] || (map["content-security-policy"] && map["content-security-policy"].includes("frame-ancestors"))) ? "LOW" : "MEDIUM",
      description: "Prevents UI Redressing and Clickjacking attacks.",
      remediation: "Set 'X-Frame-Options: DENY' or use CSP 'frame-ancestors 'none''."
    },
    {
      key: "xcto",
      name: "X-Content-Type-Options",
      present: map["x-content-type-options"] === "nosniff",
      value: map["x-content-type-options"] || null,
      severity: map["x-content-type-options"] === "nosniff" ? "LOW" : "MEDIUM",
      description: "Prevents browser from MIME-sniffing away from declared Content-Type.",
      remediation: "Set 'X-Content-Type-Options: nosniff'."
    },
    {
      key: "rp",
      name: "Referrer-Policy",
      present: !!map["referrer-policy"],
      value: map["referrer-policy"] || null,
      severity: map["referrer-policy"] ? "LOW" : "INFO",
      description: "Restricts leakage of sensitive parameters via the Referer header.",
      remediation: "Set 'Referrer-Policy: strict-origin-when-cross-origin'."
    },
    {
      key: "cors",
      name: "Access-Control-Allow-Origin",
      present: !!map["access-control-allow-origin"],
      value: map["access-control-allow-origin"] || null,
      severity: map["access-control-allow-origin"] === "*" ? "MEDIUM" : "INFO",
      description: "CORS configuration for cross-origin resource requests.",
      remediation: map["access-control-allow-origin"] === "*" ? "Wildcard '*' origin detected with API responses." : "Origin verified."
    }
  ];

  const serverInfo = {
    server: map["server"] || "Not Disclosed",
    xPoweredBy: map["x-powered-by"] || null
  };

  return { checks, serverInfo, rawHeaders: map };
}
