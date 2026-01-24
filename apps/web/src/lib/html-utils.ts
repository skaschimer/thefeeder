/**
 * Decode HTML entities for display
 * This is safe because we're only decoding entities, not rendering HTML
 */
export function decodeHtmlEntities(text: string): string {
  if (typeof window === 'undefined') {
    // Server-side: manual decoding
    const entities: Record<string, string> = {
      '&amp;': '&',
      '&lt;': '<',
      '&gt;': '>',
      '&quot;': '"',
      '&#39;': "'",
      '&apos;': "'",
      '&nbsp;': ' ',
      '&#160;': ' ',
    };
    
    let decoded = text;
    
    // Replace named entities
    Object.keys(entities).forEach(entity => {
      decoded = decoded.replace(new RegExp(entity, 'g'), entities[entity]);
    });
    
    // Replace numeric entities (&#123; or &#xAB;)
    decoded = decoded.replace(/&#(\d+);/g, (match, dec) => {
      return String.fromCharCode(parseInt(dec, 10));
    });
    decoded = decoded.replace(/&#x([0-9a-fA-F]+);/g, (match, hex) => {
      return String.fromCharCode(parseInt(hex, 16));
    });
    
    return decoded;
  }
  
  // Client-side: use browser's built-in decoder
  const textarea = document.createElement('textarea');
  textarea.innerHTML = text;
  return textarea.value;
}

/**
 * Strip HTML tags from text
 */
export function stripHtmlTags(html: string): string {
  if (typeof window === 'undefined') {
    // Server-side: regex
    return html.replace(/<[^>]+>/g, '');
  }
  
  // Client-side: use DOM
  const div = document.createElement('div');
  div.innerHTML = html;
  return div.textContent || div.innerText || '';
}

/**
 * Clean broken HTML attributes that may appear in text
 * Removes patterns like ="" (empty attributes) and normalizes whitespace
 */
function cleanBrokenHtmlAttributes(text: string): string {
  return text
    .replace(/=""/g, '')           // Remove empty attributes
    .replace(/="[^"]*"/g, '')      // Remove attributes with values (in case they escape stripHtmlTags)
    .replace(/\s{2,}/g, ' ')       // Normalize multiple spaces
    .trim();
}

/**
 * Decode HTML entities and strip tags for safe display
 */
export function sanitizeForDisplay(text: string): string {
  // First decode entities
  let clean = decodeHtmlEntities(text);
  // Then strip any remaining HTML tags
  clean = stripHtmlTags(clean);
  // Finally clean broken HTML attributes
  clean = cleanBrokenHtmlAttributes(clean);
  return clean;
}
