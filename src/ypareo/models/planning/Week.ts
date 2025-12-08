import { Resource } from './Resource';
import type { WeekCode } from './types';

export class Week {
    /**
     * Creates a new Week instance.
     * @param code - The week code (e.g., 202345 for the 45th week of 2023).
     * @param label - The label or name of the week.
     * @param startDate - The start date of the week in "YYYY-MM-DD" format.
     * @param resources - The resources associated with the week.
     */
    constructor(
        public readonly code: WeekCode,
        public readonly label: string,
        public readonly startDate: string,
        public readonly resources: Resource[]
    ) {}

    /**
     * Gets the week number from the week code.
     * @returns The week number.
     */
    get weekNumber(): number {
        return parseInt(this.code.toString().slice(-2));
    }

    /**
     * Gets the year from the week code.
     * @returns The year.
     */
    get year(): number {
        return parseInt(this.code.toString().slice(0, 4));
    }

    /**
     * Gets the primary resource of the week.
     * @returns The primary resource.
     */
    get resource(): Resource {
        return this.resources[0];
    }

    /**
     * Gets the total hours of all resources in the week.
     * @returns The total hours.
     */
    get totalHours(): number {
        return this.resources.reduce((sum, r) => sum + r.totalHours, 0);
    }

    /**
     * Converts the Week instance to a JSON object.
     * @returns A JSON representation of the Week instance.
     */
    toJSON(): Record<string, any> {
        return {
            code: this.code,
            weekNumber: this.weekNumber,
            year: this.year,
            totalHours: this.totalHours,
        };
    }
}
