/**
 * XML sanitization for tolerant feed parsing.
 * Fixes malformed comments and unescaped ampersands that break strict parsers.
 */

/**
 * Remove or fix malformed XML/HTML comments.
 * - Well-formed <!-- ... --> are removed.
 * - Malformed <!-- ... that never closes: strip from <!-- up to next >
 */
function sanitizeComments(xml: string): string {
  let out = xml;
  out = out.replace(/<!--[\s\S]*?-->/g, '');
  out = out.replace(/<!--[\s\S]*?>/g, '');
  return out;
}

/**
 * Replace bare & that are not part of a valid entity with &amp;.
 * Valid: &amp; &lt; &gt; &quot; &apos; &#123; &#xAB; or &name; (alphanumeric name).
 */
function sanitizeAmpersands(xml: string): string {
  return xml.replace(/&(?!(?:amp|lt|gt|quot|apos|#\d+|#x[0-9a-fA-F]+|[a-zA-Z][a-zA-Z0-9]*);)/g, '&amp;');
}

/**
 * Fix "Attribute without value": bare attribute names get value="".
 * - "<tag foo>" -> "<tag foo="">"
 * - "<tag a b c>" -> "<tag a="" b="" c="">"
 * Match \s+name when next is > or space+letter (start of next attr). Repeat to fix all.
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
