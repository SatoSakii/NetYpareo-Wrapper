import { Grade } from './Grade';
import { SubjectStats } from './SubjectStats';

export class Subject {
    /**
     * Creates a new Subject instance.
     * @param code - The subject code.
     * @param name - The subject name.
     * @param grades - The list of grades for the subject.
     * @param stats - The statistics for the subject.
     * @param comment - An optional comment for the subject.
     */
    constructor(
        public readonly code: number,
        public readonly name: string,
        public readonly grades: Grade[],
        public readonly stats: SubjectStats,
        public readonly comment?: string
    ) {}

    /**
     * Indicates whether the subject has any grades.
     * @return True if the subject has grades, false otherwise.
     */
    get hasGrades(): boolean {
        return this.grades.length > 0;
    }

    /**
     * Indicates whether the subject has a comment.
     * @return True if the subject has a comment, false otherwise.
     */
    get hasComment(): boolean {
        return (
            !!this.comment && this.comment !== 'Aucune appréciation renseignée.'
        );
    }

    /**
     * Converts the Subject instance to a JSON object.
     * @returns A JSON representation of the Subject instance.
     */
    toJSON(): Record<string, any> {
        return {
            code: this.code,
            name: this.name,
            grades: this.grades.map(g => g.toJSON()),
            stats: this.stats.toJSON(),
            comment: this.comment,
            hasGrades: this.hasGrades,
            hasComment: this.hasComment,
        };
    }
}
