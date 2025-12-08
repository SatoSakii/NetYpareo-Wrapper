import { MINUTES_PER_HOUR } from '../../constants/planning';
import { Constraint } from './Constraint';
import { Session } from './Session';
import type { DayNumber, ResourceType } from './types';

export class Resource {
    /**
     * Creates a new Resource instance.
     * @param code - The resource code.
     * @param type - The resource type.
     * @param label - The resource label.
     * @param typeLabel - The label for the resource type.
     * @param sessions - The sessions associated with the resource.
     * @param constraints - The constraints associated with the resource.
     */
    constructor(
        public readonly code: number,
        public readonly type: ResourceType,
        public readonly label: string,
        public readonly typeLabel: string,
        public readonly sessions: Session[],
        public readonly constraints: Constraint[]
    ) {}

    /**
     * Gets the total hours of all sessions in the resource.
     * @returns The total hours.
     */
    get totalHours(): number {
        const totalMinutes = this.sessions.reduce(
            (sum, s) => sum + s.duration,
            0
        );

        return Math.round((totalMinutes / MINUTES_PER_HOUR) * 100) / 100;
    }

    /**
     * Gets today's sessions.
     * @returns An array of today's sessions.
     */
    get today(): Session[] {
        const today = new Date().getDay() as DayNumber;

        return this.sessions.filter(s => s.dayNumber === today);
    }

    /**
     * Gets tomorrow's sessions.
     * @returns An array of tomorrow's sessions.
     */
    get tomorrow(): Session[] {
        const tomorrow = ((new Date().getDay() + 1) % 7) as DayNumber;

        return this.sessions.filter(s => s.dayNumber === tomorrow);
    }

    /**
     * Gets sessions for a specific day.
     * @param dayNumber - The day number to get sessions for (0 for Sunday, 6 for Saturday).
     * @returns An array of sessions for the specified day.
     */
    get homework(): Session[] {
        return this.sessions.filter(s => s.hasHomework);
    }

    /**
     * Gets sessions for a specific day.
     * @param dayNumber - The day number to get sessions for (0 for Sunday, 6 for Saturday).
     * @returns An array of sessions for the specified day.
     */
    getDay(dayNumber: DayNumber): Session[] {
        return this.sessions.filter(s => s.dayNumber === dayNumber);
    }

    /**
     * Converts the Resource instance to a JSON object.
     * @returns A JSON representation of the Resource instance.
     */
    toJSON(): Record<string, any> {
        return {
            code: this.code,
            label: this.label,
            totalHours: this.totalHours,
            sessionsCount: this.sessions.length,
        };
    }
}
