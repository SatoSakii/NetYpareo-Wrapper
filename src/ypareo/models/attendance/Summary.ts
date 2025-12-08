export class Summary {
    /**
     * Creates a new Summary instance.
     * @param absencesMinutes - The total absences duration in minutes.
     * @param latesMinutes - The total lates duration in minutes.
     * @param earlyDeparturesMinutes - The total early departures duration in minutes.
     * @param justifiedMinutes - The total justified duration in minutes.
     * @param unjustifiedMinutes - The total unjustified duration in minutes.
     */
    constructor(
        public readonly absencesMinutes: number,
        public readonly latesMinutes: number,
        public readonly earlyDeparturesMinutes: number,
        public readonly justifiedMinutes: number,
        public readonly unjustifiedMinutes: number
    ) {}

    /**
     * Gets the total absences duration in hours, rounded to two decimal places.
     * @return The total absences duration in hours.
     */
    get absencesHours(): number {
        return Math.round((this.absencesMinutes / 60) * 100) / 100;
    }

    /**
     * Gets the total lates duration in hours, rounded to two decimal places.
     * @return The total lates duration in hours.
     */
    get latesHours(): number {
        return Math.round((this.latesMinutes / 60) * 100) / 100;
    }

    /**
     * Gets the total early departures duration in hours, rounded to two decimal places.
     * @return The total early departures duration in hours.
     */
    get earlyDeparturesHours(): number {
        return Math.round((this.earlyDeparturesMinutes / 60) * 100) / 100;
    }

    /**
     * Gets the total justified duration in hours, rounded to two decimal places.
     * @return The total justified duration in hours.
     */
    get justifiedHours(): number {
        return Math.round((this.justifiedMinutes / 60) * 100) / 100;
    }

    /**
     * Gets the total unjustified duration in hours, rounded to two decimal places.
     * @return The total unjustified duration in hours.
     */
    get unjustifiedHours(): number {
        return Math.round((this.unjustifiedMinutes / 60) * 100) / 100;
    }

    /**
     * Gets the total duration of all records in minutes.
     * @return The total duration in minutes.
     */
    get totalMinutes(): number {
        return (
            this.absencesMinutes +
            this.latesMinutes +
            this.earlyDeparturesMinutes
        );
    }

    /**
     * Gets the total duration of all records in hours, rounded to two decimal places.
     * @return The total duration in hours.
     */
    get totalHours(): number {
        return Math.round((this.totalMinutes / 60) * 100) / 100;
    }

    /**
     * Converts the Summary instance to a JSON object.
     * @return A JSON representation of the Summary instance.
     */
    toJSON(): Record<string, any> {
        return {
            absences: {
                minutes: this.absencesMinutes,
                hours: this.absencesHours,
            },
            lates: {
                minutes: this.latesMinutes,
                hours: this.latesHours,
            },
            earlyDepartures: {
                minutes: this.earlyDeparturesMinutes,
                hours: this.earlyDeparturesHours,
            },
            justified: {
                minutes: this.justifiedMinutes,
                hours: this.justifiedHours,
            },
            unjustified: {
                minutes: this.unjustifiedMinutes,
                hours: this.unjustifiedHours,
            },
            total: {
                minutes: this.totalMinutes,
                hours: this.totalHours,
            },
        };
    }
}
