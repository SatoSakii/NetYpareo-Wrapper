import type { HttpClient } from '../../http';
import { DEFAULTS_URLS } from '../constants';
import type { ExportMode, WeekCode } from '../models/planning';
import { Planning } from '../models/planning/Planning';
import { parsePlanning } from '../parsers/planning';
import { bufferToHtml, Cache } from '../utils';

export class PlanningManager {
    private cache = new Cache<Planning>(5);
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
        const cached = this.cache.get(cacheKey);

        if (cached) return cached;

        const url =
            weekCode ?
                `${DEFAULTS_URLS.planning.default}?semaineDebut=${weekCode}`
            :   DEFAULTS_URLS.planning.default;

        const response = await this.http.get(url, {
            headers: {
                Origin: this.http.getBaseUrl(),
                'Content-Type': 'text/html; charset=UTF-8',
            },
        });
        const html = bufferToHtml(response.data);
        const planning = parsePlanning(html, this);

        this.cache.set(cacheKey, planning);

        return planning;
    }

    /**
     * Refreshes the cached planning for the specified week code.
     * @param weekCode - The week code to refresh the planning for. If not provided, refreshes the current week.
     * @returns A promise that resolves to the refreshed Planning instance.
     */
    async refresh(weekCode?: WeekCode): Promise<Planning> {
        if (weekCode) this.cache.delete(weekCode.toString());
        else this.cache.clear();

        return this.fetch(weekCode);
    }

    /**
     * Exports the planning for the specified week code as a PDF.
     * @param weekCode - The week code to export the planning for.
     * @param mode - The export mode, either 'calendrier', 'detaille' or 'detaille-mensuel'. Defaults to 'calendrier'.
     * @returns A promise that resolves to a Buffer containing the PDF data.
     */
    async exportPDF(
        weekCode: WeekCode,
        mode: ExportMode = 'calendrier'
    ): Promise<Buffer> {
        const response = await this.http.get(
            `${DEFAULTS_URLS.planning.pdf}?semaineDebut=${weekCode}&mode=${mode}`,
            {
                responseType: 'arrayBuffer',
                headers: {
                    Origin: this.http.getBaseUrl(),
                    'Content-Type': 'text/html; charset=UTF-8',
                },
            }
        );

        return Buffer.from(response.data);
    }
}
