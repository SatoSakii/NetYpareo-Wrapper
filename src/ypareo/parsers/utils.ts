import * as cheerio from 'cheerio';

/**
 * Normalizes text by replacing multiple whitespace characters with a single space and trimming.
 * @param s - The input string to normalize.
 * @returns The normalized string or null if the input is null or undefined.
 */
export function normalizeText(s?: string | null): string | null {
    if (!s) return null;
    return s.replace(/\s+/g, ' ').trim();
}

/**
 * Extracts the CSRF token from the given HTML content.
 * @param html - The HTML content to extract the CSRF token from.
 * @returns The CSRF token if found, otherwise null.
 */
export function extractCsrfToken(html: string): string | null {
    const $ = cheerio.load(html);

    const tokenCsrf = $('input[name="token_csrf"]').attr('value') ?? null;
    return tokenCsrf;
}
