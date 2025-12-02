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
	const $label = $('.user-info-label').first();

	let rawFull: string | null = null;
	if ($label.length)
		rawFull = $label.clone().children().remove().end().text().trim() || null;

	const fullName = normalizeText(rawFull) || undefined;

	return {
		username,
		fullName,
		avatarUrl: undefined
	};
}