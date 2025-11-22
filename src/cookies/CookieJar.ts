import { Cookie } from './Cookie';
import { SerializedCookie } from './types';

export class CookieJar {
	private cookies: Map<string, Cookie> = new Map();

	/**
	 * Adds a cookie to the jar.
	 * @param cookie The Cookie instance or Set-Cookie string to add.
	 * @param requestUrl The URL of the request that received the cookie (needed for parsing).
	 */
	setCookie(cookie: Cookie | string, requestUrl: string): void {
		let cookieObj: Cookie | null;

		if (typeof cookie === 'string')
			cookieObj = Cookie.parse(cookie, requestUrl);
		else
			cookieObj = cookie;
		if (!cookieObj)
			return;

		const id = this.getCookieId(cookieObj);

		if (cookieObj.isExpired()) {
			this.cookies.delete(id);
			return;
		}
		this.cookies.set(id, cookieObj);
	}

	/**
	 * Retrieves all cookies matching the given URL.
	 * @param requestUrl The URL to match cookies against.
	 * @returns An array of matching Cookie instances.
	 */
	getCookies(requestUrl: string): Cookie[] {
		this.removeExpiredCookies();

		const matching: Cookie[] = [];

		for (const cookie of this.cookies.values()) {
			if (cookie.matches(requestUrl)) {
				cookie.lastAccessed = new Date();
				matching.push(cookie);
			}
		}
		return matching;
	}

	/**
	 * Retrieves the cookie string suitable for HTTP headers for the given URL.
	 * @param requestUrl The URL to match cookies against.
	 * @returns A string of cookies formatted for HTTP headers.
	 */
	getCookieString(requestUrl: string): string {
		const cookies = this.getCookies(requestUrl);
		return cookies.map(c => c.toString()).join('; ');
	}

	/**
	 * Clears all cookies from the jar.
	 */
	clear(): void {
		this.cookies.clear();
	}

	/**
	 * Removes expired cookies from the jar.
	 */
	private removeExpiredCookies(): void {
		for (const [id, cookie] of this.cookies.entries()) {
			if (cookie.isExpired())
				this.cookies.delete(id);
		}
	}

	/**
	 * Generates a unique identifier for a cookie based on its key, domain, and path.
	 * @param cookie The Cookie instance.
	 * @returns A unique string identifier for the cookie.
	 */
	private getCookieId(cookie: Cookie): string {
		const domain = cookie.domain || '';
		const path = cookie.path || '/';

		return `${domain}|${path}|${cookie.key}`;
	}

	/**
	 * Serializes the cookie jar to a JSON string.
	 * @returns The serialized cookie jar.
	 */
	serialize(): string {
		this.removeExpiredCookies();

		const serializedCookies: SerializedCookie[] = [];

		for (const cookie of this.cookies.values())
			serializedCookies.push(cookie.serialize());

		return JSON.stringify(serializedCookies, null, 2);
	}

	/**
	 * Deserializes a JSON string into a CookieJar instance.
	 * @param data The serialized cookie jar string.
	 * @returns A CookieJar instance.
	 */
	static deserialize(data: string): CookieJar {
		const jar = new CookieJar();

		try {
			const serialized: SerializedCookie[] = JSON.parse(data);

			for (const cookieData of serialized) {
				const cookie = Cookie.deserialize(cookieData);

				if (!cookie.isExpired()) {
					const id = jar.getCookieId(cookie);
					jar.cookies.set(id, cookie);
				}
			}
		} catch {}

		return jar;
	}

	/**
	 * Retrieves all cookies in the jar.
	 * @returns An array of all Cookie instances.
	 */
	getAllCookies(): Cookie[] {
		this.removeExpiredCookies();
		return Array.from(this.cookies.values());
	}

	/**
	 * Gets the number of cookies in the jar.
	 * @returns The count of cookies.
	 */
	size(): number {
		this.removeExpiredCookies();
		return this.cookies.size;
	}

	/**
	 * Removes a specific cookie from the jar.
	 * @param cookie The Cookie instance to remove.
	 */
	removeCookie(cookie: Cookie): void {
		const id = this.getCookieId(cookie);
		this.cookies.delete(id);
	}

	/**
	 * Removes a cookie by its key, domain, and path.
	 * @param key The cookie key.
	 * @param domain The cookie domain (optional).
	 * @param path The cookie path (optional).
	 */
	removeCookieByKey(key: string, domain?: string, path?: string): void {
		const id = `${domain || ''}|${path || '/'}|${key}`;
		this.cookies.delete(id);
	}

	/**
	 * Checks if a specific cookie exists in the jar.
	 * @param cookie The Cookie instance to check.
	 * @returns True if the cookie exists, false otherwise.
	 */
	hasCookie(cookie: Cookie): boolean {
		const id = this.getCookieId(cookie);
		return this.cookies.has(id);
	}

	/**
	 * Checks if a cookie exists by its key, domain, and path.
	 * @param key The cookie key.
	 * @param domain The cookie domain (optional).
	 * @param path The cookie path (optional).
	 * @returns True if the cookie exists, false otherwise.
	 */
	hasCookieByKey(key: string, domain?: string, path?: string): boolean {
		const id = `${domain || ''}|${path || '/'}|${key}`;
		return this.cookies.has(id);
	}
}