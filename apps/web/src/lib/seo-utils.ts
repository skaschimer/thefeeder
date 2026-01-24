/**
 * SEO utility functions
 * Helper functions for generating SEO metadata and absolute URLs
 */

/**
 * Get the base site URL from environment variables.
 * Fallback usa localhost com a porta oficial (8041).
 */
export function getBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL;
  }
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return "http://localhost:8041";
}

/**
 * Convert a relative URL to an absolute URL
 */
export function getAbsoluteUrl(path: string): string {
  const baseUrl = getBaseUrl();
  // Ensure path starts with /
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  // Remove trailing slash from base URL
  const cleanBaseUrl = baseUrl.replace(/\/$/, "");
  return `${cleanBaseUrl}${normalizedPath}`;
}

/**
 * Truncate text to a maximum length for meta descriptions
 */
export function truncateMetaText(text: string, maxLength: number = 160): string {
  if (text.length <= maxLength) {
    return text;
  }
  
  // Truncate at word boundary
  const truncated = text.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(" ");
  
  if (lastSpace > 0) {
    return truncated.substring(0, lastSpace) + "...";
  }
  
  return truncated + "...";
}

/**
 * Get default Open Graph image URL
 */
export function getDefaultOgImage(): string {
  return getAbsoluteUrl("/logo.png");
}

