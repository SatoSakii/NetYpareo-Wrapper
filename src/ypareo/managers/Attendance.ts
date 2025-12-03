import type { HttpClient } from '../../http';
import { Report } from '../models/attendance';
import { parseAttendance } from '../parsers';
import { DEFAULTS_HEADERS, DEFAULTS_URLS } from '../constants';

interface CacheEntry {
	data: Report;
	timestamp: number;
}

export class AttendanceManager {
	private cache = new Map<string, CacheEntry>();
	private cacheTTL = 5 * 60 * 1000;

	/**
	 * Creates a new AttendanceManager instance.
	 * @param http - The HttpClient instance for making requests.
	 */
	constructor(private readonly http: HttpClient) {}

	/**
	 * Fetches the attendance report for the specified registration code.
	 * @param registrationCode - The registration code to fetch the attendance for. If not provided, fetches the current user's attendance.
	 * @returns A promise that resolves to the Report instance.
	 */
	async fetch(registrationCode?: number): Promise<Report> {
		const cacheKey = registrationCode?.toString() ?? '';
		const cached = this.getCache(cacheKey);

		if (cached)
			return cached;

		const url = registrationCode
			? `${DEFAULTS_URLS.attendance}/${registrationCode}/`
			: DEFAULTS_URLS.attendance;

		const response = await this.http.get(url, {
			responseType: 'arrayBuffer',
			headers: {
				'Origin': this.http.getBaseUrl(),
				'Content-Type': 'text/html; charset=UTF-8',
				...DEFAULTS_HEADERS
			}
		});
		const html = this.toHtml(Buffer.from(response.data).toString('latin1'));
		const report = parseAttendance(html);

		this.setCache(cacheKey, report);

		return report;
	}

	/**
	 * Refreshes the cached attendance report for the specified registration code.
	 * @param registrationCode - The registration code to refresh the attendance for. If not provided, refreshes the current user's attendance.
	 * @returns A promise that resolves to the refreshed Report instance.
	 */
	async refresh(registrationCode?: number): Promise<Report> {
		if (registrationCode)
			this.cache.delete(registrationCode.toString());
		else
			this.cache.clear();

		return this.fetch(registrationCode);
	}

	/**
	 * Gets the cached Report for the specified key if it exists and is still valid.
	 * @param key - The cache key.
	 * @returns The cached Report or null if not found or expired.
	 */
	private getCache(key: string): Report | null {
		const entry = this.cache.get(key);

		if (!entry)
			return null;
		if (Date.now() - entry.timestamp > this.cacheTTL) {
			this.cache.delete(key);
			return null;
		}

		return entry.data;
	}

	/**
	 * Sets the cache for the specified key with the given Report data.
	 * @param key - The cache key.
	 * @param data - The Report data to cache.
	 */
	private setCache(key: string, data: Report): void {
		this.cache.set(key, { data, timestamp: Date.now() });
	}

	/**
	 * Converts the response data to an HTML string.
	 * @param data - The response data.
	 * @returns The HTML string.
	 */
	private toHtml(data: any): string {
		if (Buffer.isBuffer(data))
			return data.toString('latin1');
		if (typeof data === 'string')
			return data;

		throw new Error(`Unexpected response type: ${typeof data}`);
	}
}