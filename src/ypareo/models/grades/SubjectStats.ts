export class SubjectStats {
    /**
     * Creates a new SubjectStats instance.
     * @param studentAverage - The student's average for the subject.
     * @param groupAverage - The group's average for the subject.
     * @param minAverage - The minimum average for the subject.
     * @param maxAverage - The maximum average for the subject.
     */
    constructor(
        public readonly studentAverage: number | null,
        public readonly groupAverage: number | null,
        public readonly minAverage: number | null,
        public readonly maxAverage: number | null
    ) {}

    /**
     * Indicates whether the subject has statistical data.
     * @return True if statistical data is available, false otherwise.
     */
    get hasData(): boolean {
        return this.studentAverage !== null
    }

    /**
     * Converts the SubjectStats instance to a JSON object.
     * @returns A JSON representation of the SubjectStats instance.
     */
    toJSON(): Record<string, any> {
        return {
            studentAverage: this.studentAverage,
            groupAverage: this.groupAverage,
            minAverage: this.minAverage,
            maxAverage: this.maxAverage,
            hasData: this.hasData,
        }
    }
}
