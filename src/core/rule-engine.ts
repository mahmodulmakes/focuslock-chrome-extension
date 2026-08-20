// Generic "does this URL match this rule" logic. Shared by every hard-block feature
// (Block Sites, Reel Blocks, Limiter). Feed Blocks and Password Protection use content
// scripts instead — see FocusLock-Development-Spec.md for why.

export function normalizeHost(hostname: string): string {
  return hostname.replace(/^www\./i, "").toLowerCase();
}

function hostFromPatternDomain(domainPart: string): string {
  return normalizeHost(domainPart.replace(/^https?:\/\//i, "").split("/")[0] ?? "");
}

/** True if `url`'s host equals `domain`, or is a subdomain of it. */
export function urlMatchesDomain(url: string, domain: string): boolean {
  try {
    const host = normalizeHost(new URL(url).hostname);
    const target = hostFromPatternDomain(domain);
    if (!target) return false;
    return host === target || host.endsWith("." + target);
  } catch {
    return false;
  }
}

function wildcardToRegExp(segment: string): RegExp {
  const escaped = segment.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*");
  return new RegExp("^" + escaped + "$", "i");
}

/**
 * Matches a user-entered pattern like "reddit.com", "reddit.com/*", or
 * "reddit.com/r/funny*" against a URL. Domain part always matches subdomains;
 * path part (if present) supports "*" wildcards.
 */
export function urlMatchesPattern(url: string, pattern: string): boolean {
  const trimmed = pattern.trim();
  if (!trimmed) return false;

  const withoutProtocol = trimmed.replace(/^https?:\/\//i, "");
  const [domainPart, ...pathParts] = withoutProtocol.split("/");

  if (!urlMatchesDomain(url, domainPart ?? "")) return false;
  if (pathParts.length === 0) return true;

  const pathPattern = "/" + pathParts.join("/");
  if (pathPattern === "/*" || pathPattern === "/") return true;

  try {
    const u = new URL(url);
    return wildcardToRegExp(pathPattern).test(u.pathname + u.search);
  } catch {
    return false;
  }
}

export interface MatchResult {
  matched: boolean;
  /** Human-readable reason, shown on the blocked page. */
  reason?: string;
}

export interface CategoryLike {
  id: string;
  label: string;
  domains: string[];
  enabled: boolean;
}

export interface PatternRuleLike {
  id: string;
  label: string;
  pattern: string;
  enabled: boolean;
}

export function matchCategories(url: string, categories: CategoryLike[]): MatchResult {
  for (const category of categories) {
    if (!category.enabled) continue;
    for (const domain of category.domains) {
      if (urlMatchesDomain(url, domain)) {
        return { matched: true, reason: `Blocked category: ${category.label}` };
      }
    }
  }
  return { matched: false };
}

export function matchCustomSites(url: string, sites: PatternRuleLike[]): MatchResult {
  for (const site of sites) {
    if (!site.enabled) continue;
    if (urlMatchesPattern(url, site.pattern)) {
      return { matched: true, reason: `Blocked site: ${site.label}` };
    }
  }
  return { matched: false };
}
