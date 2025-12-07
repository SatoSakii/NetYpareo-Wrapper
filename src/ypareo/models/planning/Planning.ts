import type { PlanningManager } from '../../managers'
import { Configuration } from './Configuration'
import { Session } from './Session'
import type { DayNumber, ExportMode, WeekCode } from './types'
import { Week } from './Week'

export class Planning {
    /**
     * Creates a new Planning instance.
     * @param configuration - The planning configuration.
     * @param weeks - The weeks included in the planning.
     * @param manager - The PlanningManager instance for managing planning operations.
     */
    constructor(
        public readonly configuration: Configuration,
        public readonly weeks: Week[],
        private readonly manager: PlanningManager
    ) {}

    /**
     * Gets the first week of the planning.
     * @returns The first week.
     */
    get week(): Week {
        return this.weeks[0]
    }

    /**
     * Gets the resource of the first week.
     * @returns The resource of the first week.
     */
    get resource() {
        return this.week.resource
    }

    /**
     * Gets all sessions across all weeks.
     * @returns An array of all sessions.
     */
    get sessions(): Session[] {
        return this.weeks.flatMap((w) => w.resources.flatMap((r) => r.sessions))
    }

    /**
     * Gets today's sessions.
     * @returns An array of today's sessions.
     */
    get today(): Session[] {
        return this.resource.today
    }

    /**
     * Gets tomorrow's sessions.
     * @returns An array of tomorrow's sessions.
     */
    get tomorrow(): Session[] {
        return this.resource.tomorrow
    }

    /**
     * Gets sessions that have homework.
     * @returns An array of sessions with homework.
     */
    get homework(): Session[] {
        return this.sessions.filter((s) => s.hasHomework)
    }

    /**
     * Gets sessions for a specific day.
     * @param dayNumber - The day number to get sessions for (0 for Sunday, 6 for Saturday).
     * @returns An array of sessions for the specified day.
     */
    getDay(dayNumber: DayNumber): Session[] {
        return this.resource.getDay(dayNumber)
    }

    /**
     * Gets the total hours of all sessions across all weeks.
     * @returns The total hours.
     */
    get totalHours(): number {
        return this.weeks.reduce((sum, w) => sum + w.totalHours, 0)
    }

    /**
     * Fetches the planning for the next week.
     * @returns A Promise that resolves to the Planning instance for the next week.
     */
    async nextWeek(): Promise<Planning> {
        return this.manager.fetch(this.nextWeekCode())
    }

    /**
     * Fetches the planning for the previous week.
     * @returns A Promise that resolves to the Planning instance for the previous week.
     */
    async previousWeek(): Promise<Planning> {
        return this.manager.fetch(this.prevWeekCode())
    }

    /**
     * Refreshes the current planning.
     * @returns A Promise that resolves to the refreshed Planning instance.
     */
    async refresh(): Promise<Planning> {
        return this.manager.refresh(this.week.code)
    }

    /**
     * Exports the current planning as a PDF.
     * @param mode - The export mode, either 'calendrier' or 'detaille'. Defaults to 'calendrier'.
     * @returns A Promise that resolves to a Buffer containing the PDF data.
     */
    async exportPDF(mode: ExportMode = 'calendrier'): Promise<Buffer> {
        return this.manager.exportPDF(this.week.code, mode)
    }

    /**
     * Calculates the week code for the next week.
     * @returns The week code for the next week.
     */
    private nextWeekCode(): WeekCode {
        const year = Math.floor(this.week.code / 100)
        const week = this.week.code % 100

        return week >= 52 ? (year + 1) * 100 + 1 : this.week.code + 1
    }

    /**
     * Calculates the week code for the previous week.
     * @returns The week code for the previous week.
     */
    private prevWeekCode(): WeekCode {
        const year = Math.floor(this.week.code / 100)
        const week = this.week.code % 100

        return week <= 1 ? (year - 1) * 100 + 52 : this.week.code - 1
    }

    /**
     * Converts the Planning instance to a JSON object.
     * @returns A JSON representation of the Planning instance.
     */
    toJSON(): Record<string, any> {
        return {
            totalHours: this.totalHours,
            totalSessions: this.sessions.length,
            weeks: this.weeks.map((w) => w.toJSON()),
            sessions: this.sessions,
        }
    }
}
