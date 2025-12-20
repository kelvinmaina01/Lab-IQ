import DOMPurify from 'dompurify';

/**
 * Sanitizes HTML content to prevent XSS attacks
 * Allows basic formatting tags (bold, italic, links, lists)
 * Removes scripts, iframes, and dangerous attributes
 */
export const sanitizeHTML = (dirty: string): string => {
    return DOMPurify.sanitize(dirty, {
        ALLOWED_TAGS: [
            'b', 'i', 'em', 'strong', 'u', 'a', 'p', 'br',
            'ul', 'ol', 'li', 'code', 'pre', 'blockquote',
            'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'span', 'div'
        ],
        ALLOWED_ATTR: ['href', 'target', 'rel', 'class'],
        ALLOW_DATA_ATTR: false,
        ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
    });
};

/**
 * Sanitizes user-generated text for display
 * Converts plain text to HTML-safe format with basic markdown-like support
 */
export const sanitizeText = (text: string): string => {
    if (!text) return '';

    // First escape HTML to prevent XSS
    let safe = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;');

    // Then apply basic markdown-like formatting (safe because we already escaped)
    safe = safe
        // Bold: **text** or __text__
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/__(.+?)__/g, '<strong>$1</strong>')
        // Italic: *text* or _text_
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        .replace(/_(.+?)_/g, '<em>$1</em>')
        // Code: `code`
        .replace(/`(.+?)`/g, '<code class="px-1 py-0.5 rounded bg-muted text-xs">$1</code>')
        // Links: [text](url)
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-primary underline hover:text-primary/80">$1</a>')
        // Line breaks
        .replace(/\n/g, '<br>');

    return safe;
};

/**
 * Sanitizes channel/list/canvas names
 * Removes special characters that could cause issues
 */
export const sanitizeName = (name: string): string => {
    if (!name) return '';
    return name
        .replace(/[<>'"]/g, '')
        .trim()
        .substring(0, 100);
};

/**
 * Sanitizes email addresses
 * Basic validation and XSS prevention
 */
export const sanitizeEmail = (email: string): string => {
    if (!email) return '';
    return email
        .toLowerCase()
        .trim()
        .replace(/[<>'"]/g, '')
        .substring(0, 255);
};

/**
 * Sanitizes search queries
 * Prevents SQL injection patterns and XSS
 */
export const sanitizeSearchQuery = (query: string): string => {
    if (!query) return '';
    return query
        .replace(/[<>'"]/g, '')
        .replace(/[;\\]/g, '')
        .trim()
        .substring(0, 200);
};
