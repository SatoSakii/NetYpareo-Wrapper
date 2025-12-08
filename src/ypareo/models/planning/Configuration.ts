export class Configuration {
    /**
     * Creates a new Configuration instance.
     * @param displayMode - The display mode of the planning.
     * @param landscapeOrientation - Whether the planning is in landscape orientation.
     * @param autoSize - Whether the planning auto-sizes to fit the screen.
     * @param zoom - The zoom level of the planning.
     * @param showConstraints - Whether to show constraints in the planning.
     * @param groupSessionColor - The color used for group sessions.
     * @param showRowHeaderTitle - Whether to show titles in row headers.
     * @param showColumnHeaderTitle - Whether to show titles in column headers.
     * @param startMinute - The starting minute of the planning day.
     * @param endMinute - The ending minute of the planning day.
     * @param days - The days of the week that are visible in the planning.
     */
    constructor(
        public readonly displayMode: number,
        public readonly landscapeOrientation: boolean,
        public readonly autoSize: boolean,
        public readonly zoom: number,
        public readonly showConstraints: boolean,
        public readonly groupSessionColor: string,
        public readonly showRowHeaderTitle: boolean,
        public readonly showColumnHeaderTitle: boolean,
        public readonly startMinute: number,
        public readonly endMinute: number,
        public readonly days: number[]
    ) {}

    /**
     * Gets the total duration of the planning day in minutes.
     * @return The total duration in minutes.
     */
    get totalMinutes(): number {
        return this.endMinute - this.startMinute;
    }

    /**
     * Gets the total duration of the planning day in hours.
     * @return The total duration in hours.
     */
    get totalHours(): number {
        return this.totalMinutes / 60;
    }

    /**
     * Checks if a specific day is visible in the planning.
     * @param dayNumber - The day number to check (0 for Sunday, 6 for Saturday).
     * @returns True if the day is visible, false otherwise.
     */
    isDayVisible(dayNumber: number): boolean {
        return this.days.includes(dayNumber);
    }

    /**
     * Converts the Configuration instance to a JSON object.
     * @returns A JSON representation of the Configuration instance.
     */
    toJSON(): Record<string, any> {
        return {
            displayMode: this.displayMode,
            landscapeOrientation: this.landscapeOrientation,
            autoSize: this.autoSize,
            zoom: this.zoom,
            showConstraints: this.showConstraints,
            groupSessionColor: this.groupSessionColor,
            showRowHeaderTitle: this.showRowHeaderTitle,
            showColumnHeaderTitle: this.showColumnHeaderTitle,
            startMinute: this.startMinute,
            endMinute: this.endMinute,
            totalMinutes: this.totalMinutes,
            totalHours: this.totalHours,
            days: this.days,
        };
    }
}
