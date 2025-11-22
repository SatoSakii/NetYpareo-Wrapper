import { JSDOM } from "jsdom";
import { normalizeText } from "./utils";
import type { UserData } from "../types";

/**
 * Parses a user profile HTML and extracts user data.
 * @param html - The HTML content of the user profile page.
 * @param username - The username of the user.
 * @returns An object containing the user's data.
 */
export function parseUser(html: string, username: string): UserData {
	const dom = new JSDOM(html);
	const document = dom.window.document;

	const rawFull = document.getElementsByClassName('resource-informations-title')[0]?.childNodes[0]?.textContent?.trim() ?? null;
	const fullName = normalizeText(rawFull) || undefined;
	let thumbnail = document.getElementsByClassName('photo-thumbnail')[0]?.childNodes[0]?.src ?? null;

	return {
		username,
		fullName,
		avatarUrl: thumbnail
	};
}

/**
 * Extracts the CSRF token from the given HTML content.
 * @param html - The HTML content to extract the CSRF token from.
 * @returns The CSRF token if found, otherwise null.
 */
export function extractCsrfToken(html: string): string | null {
	try {
		const dom = new JSDOM(html);
		const document = dom.window.document;

		const tokenCsrf = document.querySelector('input[name="token_csrf"]') as HTMLInputElement | null;
		return tokenCsrf?.value || null;
	} catch {
		return null;
	}
}