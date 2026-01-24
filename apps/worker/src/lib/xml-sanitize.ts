/**
 * XML sanitization for tolerant feed parsing.
 * Fixes malformed comments and unescaped ampersands that break strict parsers.
 */

/**
 * Remove or fix malformed XML/HTML comments.
 * - Well-formed <!-- ... --> are removed.
 * - Malformed <!-- ... -- (without -->) or <!-- ... that never closes: strip from <!-- until next > or limit.
 */
function sanitizeComments(xml: string): string {
  let out = xml;
  // Remove well-formed comments <!-- ... -->
  out = out.replace(/<!--[\s\S]*?-->/g, '');
  // Remove malformed: <!-- ... that never gets --> ; strip from <!-- up to next >
  out = out.replace(/<!--[\s\S]*?>/g, '');
  return out;
}

/**
 * Replace bare & that are not part of a valid entity with &amp;.
 * Valid: &amp; &lt; &gt; &quot; &apos; &#123; &#xAB; or &name; (alphanumeric name).
 */
function sanitizeAmpersands(xml: string): string {
  // Match & only when not start of a valid entity
  return xml.replace(/&(?!(?:amp|lt|gt|quot|apos|#\d+|#x[0-9a-fA-F]+|[a-zA-Z][a-zA-Z0-9]*);)/g, '&amp;');
}

/**
 * Fix "Attribute without value": bare attribute names get value="" (same logic as web).
 */
function sanitizeBareAttributes(xml: string): string {
  let prev = "";
  let s = xml;
  while (s !== prev) {
    prev = s;
    s = s.replace(/\s+([a-zA-Z][a-zA-Z0-9:_-]*)\s*(?=>|\s+[a-zA-Z])/g, " $1=\"\"");
  }
  return s;
}

/**
 * Sanitize XML string for tolerant parsing: fix malformed comments, bare ampersands, and attributes without value.
 */
export function sanitizeXml(xml: string): string {
  let s = xml;
  s = sanitizeComments(s);
  s = sanitizeAmpersands(s);
  s = sanitizeBareAttributes(s);
  return s;
}
