import type { HttpClient } from '../../http';
import { GradeReport, Period } from '../models';
import { parseGrades, parseAvailablePeriods } from '../parsers';
import { DEFAULTS_URLS } from '../constants';
import { bufferToHtml, Cache } from '../utils';

export class GradesManager {
	private cache = new Cache<GradeReport>(5);
	private periodsCache: Map<number, Period[]> = new Map();

	/**
	 * Creates a new GradesManager instance.
	 * @param http - The HttpClient instance for making requests.
	 */
	constructor(private readonly http: HttpClient) {}

	/**
	 * Fetches available evaluation periods for a registration.
	 * @param registrationCode - The registration code.
	 * @returns A promise that resolves to an array of available Period instances.
	 */
	async fetchPeriods(registrationCode: number): Promise<Period[]> {
		const cached = this.periodsCache.get(registrationCode);

		if (cached)
			return cached;

		const url = `${DEFAULTS_URLS.grades.default}/${registrationCode}/`;

		const response = await this.http.get(url, {
			responseType: 'arrayBuffer',
			headers: {
				'Origin': this.http.getBaseUrl(),
				'Content-Type': 'text/html; charset=UTF-8'
			}
		});

		const html = bufferToHtml(response.data);
		const periods = parseAvailablePeriods(html);

		this.periodsCache.set(registrationCode, periods);

		return periods;
	}

	/**
	 * Fetches grades for a specific period.
	 * @param registrationCode - The registration code.
	 * @param period - The Period instance (get it from fetchPeriods).
	 * @param subjectCode - Optional subject code to filter.
	 * @returns A promise that resolves to the GradeReport instance.
	 */
	async fetch(
		registrationCode: number,
		period: Period,
		subjectCode?: number
	): Promise<GradeReport> {
		const cacheKey = `${registrationCode}-${period.code}-${subjectCode || 'all'}`;
		const cached = this.cache.get(cacheKey);

		if (cached)
			return cached;

		let url = `${DEFAULTS_URLS.grades.api}/${registrationCode}/${period.code}`;

		if (subjectCode)
			url += `/${subjectCode}`;

		const params = new URLSearchParams();
		if (period.sessionCode)
			params.append('codeSession', period.sessionCode.toString());

		if (params.toString())
			url += `?${params.toString()}`;

		const response = await this.http.get(url, {
			responseType: 'arrayBuffer',
			headers: {
				'Origin': this.http.getBaseUrl(),
				'Content-Type': 'text/html; charset=UTF-8'
			}
		});

		const html = bufferToHtml(response.data);
		const report = parseGrades(html);

		this.cache.set(cacheKey, report);

		return report;
	}

	/**
	 * Helper to fetch grades for the full school year.
	 * @param registrationCode - The registration code.
	 * @param subjectCode - Optional subject filter.
	 * @returns A promise that resolves to the GradeReport instance.
	 */
	async fetchFullYear(registrationCode: number, subjectCode?: number): Promise<GradeReport> {
		const periods = await this.fetchPeriods(registrationCode);
		const fullYear = periods.find(p => p.isFullYear);

		if (!fullYear)
			throw new Error('Full year period not found');

		return this.fetch(registrationCode, fullYear, subjectCode);
	}

	/**
	 * Refreshes the cached grades report.
	 * @param registrationCode - The registration code.
	 * @param period - The Period instance.
	 * @param subjectCode - Optional subject code.
	 * @returns A promise that resolves to the refreshed GradeReport instance.
	 */
	async refresh(
		registrationCode: number,
		period: Period,
		subjectCode?: number
	): Promise<GradeReport> {
		const cacheKey = `${registrationCode}-${period.code}-${subjectCode || 'all'}`;
		this.cache.delete(cacheKey);

		return this.fetch(registrationCode, period, subjectCode);
	}
}