import { Subject } from './Subject';

export class GradeReport {
    /**
     * Creates a new GradeReport instance.
     * @param subjects - The list of subjects in the report.
     * @param periodName - The name of the grading period.
     * @param registrationName - The name of the student's registration.
     */
    constructor(
        public readonly subjects: Subject[],
        public readonly periodName: string,
        public readonly registrationName: string
    ) {}

    /**
     * Gets a subject by its code.
     * @param code - The subject code.
     * @return The Subject instance if found, undefined otherwise.
     */
    getSubject(code: number): Subject | undefined {
        return this.subjects.find(s => s.code === code);
    }

    /**
     * Calculates the overall average across all subjects.
     * @return The overall average, or null if no averages are available.
     */
    get overallAverage(): number | null {
        const averages = this.subjects
            .map(s => s.stats.studentAverage)
            .filter((avg): avg is number => avg !== null);

        if (averages.length === 0) return null;

        const sum = averages.reduce((acc, avg) => acc + avg, 0);

        return Math.round((sum / averages.length) * 100) / 100;
    }

    /**
     * Converts the Report instance to a JSON object.
     * @returns A JSON representation of the Report instance.
     */
    toJSON(): Record<string, any> {
        return {
            subjects: this.subjects.map(s => s.toJSON()),
            periodName: this.periodName,
            registrationName: this.registrationName,
            totalSubjects: this.subjects.length,
            overallAverage: this.overallAverage,
        };
    }
}
