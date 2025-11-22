/**
 * Normalizes text by replacing multiple whitespace characters with a single space and trimming.
 * @param s - The input string to normalize.
 * @returns The normalized string or null if the input is null or undefined.
 */
export function normalizeText(s?: string | null): string | null {
	if (!s)
		return null;
	return s.replace(/\s+/g, ' ').trim();
}