import { FULL_DAY_THRESHOLD } from '../../constants/'
import type { DayNumber } from './'

export class Constraint {
    /**
     * Creates a new Constraint instance.
     * @param weekNumber - The week number the constraint applies to.
     * @param dayNumber - The day number the constraint applies to (0 for Sunday, 6 for Saturday).
     * @param startMinute - The starting minute of the constraint (minutes since midnight).
     * @param duration - The duration of the constraint in minutes.
     * @param color - The color associated with the constraint.
     */
    constructor(
        public readonly weekNumber: number,
        public readonly dayNumber: DayNumber,
        public readonly startMinute: number,
        public readonly duration: number,
        public readonly color: string
    ) {}

    /**
     * Checks if the constraint represents a full-day constraint.
     * @returns True if the constraint is a full-day constraint, false otherwise.
     */
    get isFullDay(): boolean {
        return this.duration >= FULL_DAY_THRESHOLD
    }

    /**
     * Gets the ending minute of the constraint.
     * @returns The ending minute.
     */
    get endMinute(): number {
        return this.startMinute + this.duration
    }

    /**
     * Converts the Constraint instance to a JSON object.
     * @returns A JSON representation of the Constraint instance.
     */
    toJSON(): Record<string, any> {
        return {
            weekNumber: this.weekNumber,
            dayNumber: this.dayNumber,
            startMinute: this.startMinute,
            duration: this.duration,
            endMinute: this.endMinute,
            color: this.color,
            isFullDay: this.isFullDay,
        }
    }
}
