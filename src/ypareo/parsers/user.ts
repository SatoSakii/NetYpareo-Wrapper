import * as cheerio from 'cheerio';
import { normalizeText } from "./utils";
import type { UserData } from "../types";

/**
 * Parses a user profile HTML and extracts user data.
 * @param html - The HTML content of the user profile page.
 * @param username - The username of the user.
 * @returns An object containing the user's data.
 */
export function parseUser(html: string, username: string): UserData {
	const $ = cheerio.load(html);

	const rawFull = $('.resource-informations-title').first().text().trim() || null;
	const fullName = normalizeText(rawFull) || undefined;

	return {
		username,
		fullName,
		avatarUrl: undefined
	};
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