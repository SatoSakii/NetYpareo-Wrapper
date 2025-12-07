import { DAY_NAMES, MINUTES_PER_HOUR } from '../../constants/planning'
import { Icon } from './Icon'
import { Metadata } from './Metadata'
import type { DayNumber, SessionType, TimeString } from './types'

export class Session {
    /**
     * Creates a new Session instance.
     * @param code - The session code.
     * @param type - The session type.
     * @param color - The color associated with the session.
     * @param label - The session label.
     * @param dayNumber - The day number of the session (0 for Sunday, 6 for Saturday).
     * @param startMinute - The starting minute of the session (minutes since midnight).
     * @param duration - The duration of the session in minutes.
     * @param weekNumber - The week number the session belongs to.
     * @param details - Additional details about the session (e.g., group, teacher, room).
     * @param icons - Icons associated with the session.
     * @param metadata - Metadata associated with the session.
     * @param cssClasses - CSS classes for styling the session.
     * @param contextualMenu - Contextual menu options for the session.
     */
    constructor(
        public readonly code: number,
        public readonly type: SessionType,
        public readonly color: string,
        public readonly label: string,
        public readonly dayNumber: DayNumber,
        public readonly startMinute: number,
        public readonly duration: number,
        public readonly weekNumber: number,
        public readonly details: string[],
        public readonly icons: Icon[],
        public readonly metadata: Metadata,
        public readonly cssClasses: string = '',
        public readonly contextualMenu: string = ''
    ) {}

    /**
     * Gets the start time of the session in "HH:MM" format.
     * @returns The start time as a string.
     */
    get startTime(): TimeString {
        const hours = Math.floor(this.startMinute / MINUTES_PER_HOUR)
        const minutes = this.startMinute % MINUTES_PER_HOUR

        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}` as TimeString
    }

    /**
     * Gets the end time of the session in "HH:MM" format.
     * @returns The end time as a string.
     */
    get endTime(): TimeString {
        const totalMinutes = this.startMinute + this.duration
        const hours = Math.floor(totalMinutes / MINUTES_PER_HOUR)
        const minutes = totalMinutes % MINUTES_PER_HOUR

        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}` as TimeString
    }

    /**
     * Gets the name of the day for the session.
     * @returns The day name.
     */
    get dayName(): string {
        return DAY_NAMES[this.dayNumber]
    }

    /**
     * Gets the duration of the session in hours.
     * @returns The duration in hours.
     */
    get durationHours(): number {
        return Math.round((this.duration / MINUTES_PER_HOUR) * 100) / 100
    }

    /**
     * Gets the group associated with the session.
     * @returns The group name or null if not available.
     */
    get group(): string | null {
        return this.details[0] ?? null
    }

    /**
     * Gets the teacher associated with the session.
     * @returns The teacher name or null if not available.
     */
    get teacher(): string | null {
        return this.details[1] ?? null
    }

    /**
     * Gets the room associated with the session.
     * @returns The room name or null if not available.
     */
    get room(): string | null {
        return this.details[2] ?? null
    }

    /**
     * Checks if the session has homework assigned.
     * @returns True if the session has homework, false otherwise.
     */
    get hasHomework(): boolean {
        return this.icons.some((icon) => icon.isHomework)
    }

    /**
     * Converts the Session instance to a JSON object.
     * @returns A JSON representation of the Session instance.
     */
    toJSON(): Record<string, any> {
        return {
            code: this.code,
            label: this.label,
            dayName: this.dayName,
            startTime: this.startTime,
            endTime: this.endTime,
            durationHours: this.durationHours,
            teacher: this.teacher,
            room: this.room,
            group: this.group,
            hasHomework: this.hasHomework,
        }
    }
}
