import type { HttpClient } from '../../http'
import { DEFAULTS_URLS } from '../constants'
import { Report } from '../models/attendance'
import { parseAttendance } from '../parsers'
import { bufferToHtml, Cache } from '../utils'

export class AttendanceManager {
    private cache = new Cache<Report>(5)

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
        const cacheKey = registrationCode?.toString() ?? ''
        const cached = this.cache.get(cacheKey)

        if (cached) return cached

        const url = registrationCode
            ? `${DEFAULTS_URLS.attendance}/${registrationCode}/`
            : DEFAULTS_URLS.attendance

        const response = await this.http.get(url, {
            responseType: 'arrayBuffer',
            headers: {
                Origin: this.http.getBaseUrl(),
                'Content-Type': 'text/html; charset=UTF-8',
            },
        })
        const html = bufferToHtml(response.data)
        const report = parseAttendance(html)

        this.cache.set(cacheKey, report)

        return report
    }

    /**
     * Refreshes the cached attendance report for the specified registration code.
     * @param registrationCode - The registration code to refresh the attendance for. If not provided, refreshes the current user's attendance.
     * @returns A promise that resolves to the refreshed Report instance.
     */
    async refresh(registrationCode?: number): Promise<Report> {
        if (registrationCode) this.cache.delete(registrationCode.toString())
        else this.cache.clear()

        return this.fetch(registrationCode)
    }
}
