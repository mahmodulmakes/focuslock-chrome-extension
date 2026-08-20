// Shared by Block Sites and Limiter — both show a 2-letter badge derived from a site's domain.
export function domainInitials(value: string): string {
  const domain = value.trim().replace(/^https?:\/\//i, "").replace(/^www\./i, "");
  return domain.slice(0, 2).toUpperCase();
}
