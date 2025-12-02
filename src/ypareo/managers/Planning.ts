import type { HttpClient } from '../../http';
import { Planning } from '../models/planning/Planning';
import { parsePlanning } from '../parsers/planning';
import type { WeekCode, ExportMode } from '../models/planning';
import { DEFAULTS_HEADERS, DEFAULTS_URLS } from '../constants';

interface CacheEntry {
	data: Planning;
	timestamp: number;
}

export class PlanningManager {
	private cache = new Map<string, CacheEntry>();
	private cacheTTL = 5 * 60 * 1000;

	/**
	 * Creates a new PlanningManager instance.
	 * @param http - The HttpClient instance for making requests.
	 */
	constructor(private readonly http: HttpClient) {}

	/**
	 * Fetches the planning for the specified week code.
	 * @param weekCode - The week code to fetch the planning for. If not provided, fetches the current week.
	 * @returns A promise that resolves to the Planning instance.
	 */
	async fetch(weekCode?: WeekCode): Promise<Planning> {
		const cacheKey = weekCode?.toString() ?? 'current';
		const cached = this.getCache(cacheKey);

		if (cached)
			return cached;

		const url = weekCode
			? `${DEFAULTS_URLS.planning.planning}?semaineDebut=${weekCode}`
			: DEFAULTS_URLS.planning.planning;

		const response = await this.http.get(url, {
			headers: {
				'Origin': this.http.getBaseUrl(),
				...DEFAULTS_HEADERS
			}
		}
		);
		const html = this.toHtml(response.data);
		const planning = parsePlanning(html, this);

		this.setCache(cacheKey, planning);

		return planning;
	}

	/**
	 * Refreshes the cached planning for the specified week code.
	 * @param weekCode - The week code to refresh the planning for. If not provided, refreshes the current week.
	 * @returns A promise that resolves to the refreshed Planning instance.
	 */
	async refresh(weekCode?: WeekCode): Promise<Planning> {
		if (weekCode)
			this.cache.delete(weekCode.toString());
		else
			this.cache.clear();

		return this.fetch(weekCode);
	}

	/**
	 * Exports the planning for the specified week code as a PDF.
	 * @param weekCode - The week code to export the planning for.
	 * @param mode - The export mode, either 'calendrier', 'detaille' or 'detaille-mensuel'. Defaults to 'calendrier'.
	 * @returns A promise that resolves to a Buffer containing the PDF data.
	 */
	async exportPDF(weekCode: WeekCode, mode: ExportMode = 'calendrier'): Promise<Buffer> {
		const response = await this.http.get(
			`${DEFAULTS_URLS.planning.pdf}?semaineDebut=${weekCode}&mode=${mode}`,
			{
				responseType: 'arrayBuffer',
				headers: {
					'Origin': this.http.getBaseUrl(),
					...DEFAULTS_HEADERS
				},
			}
		);

		return Buffer.from(response.data);
	}

	/**
	 * Gets a cached Planning instance by its key.
	 * @param key - The cache key.
	 * @returns The cached Planning instance, or null if not found or expired.
	 */
	private getCache(key: string): Planning | null {
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
	 * Sets a Planning instance in the cache.
	 * @param key - The cache key.
	 * @param data - The Planning instance to cache.
	 */
	private setCache(key: string, data: Planning): void {
		this.cache.set(key, { data, timestamp: Date.now() });
	}

	/**
	 * Converts response data to an HTML string.
	 * @param data - The response data.
	 * @returns The HTML string.
	 */
	private toHtml(data: any): string {
		if (Buffer.isBuffer(data))
			return data.toString('utf-8');
		if (typeof data === 'string')
			return data;

		throw new Error(`Unexpected response type: ${typeof data}`);
	}
}