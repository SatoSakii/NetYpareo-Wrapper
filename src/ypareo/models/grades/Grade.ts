import type { EvaluationType, GradeStatus } from './types';

export class Grade {
    /**
     * Creates a new Grade instance.
     * @param teacher - The name of the teacher who assigned the grade.
     * @param teacherInitials - The initials of the teacher.
     * @param date - The date the grade was assigned.
     * @param type - The type of evaluation.
     * @param theme - The theme or subject of the evaluation.
     * @param coefficient - The coefficient of the grade.
     * @param value - The value of the grade, or null if not graded.
     * @param status - The status of the grade.
     * @param absenceReason - The reason for absence, if applicable.
     */
    constructor(
        public readonly teacher: string,
        public readonly teacherInitials: string,
        public readonly date: Date,
        public readonly type: EvaluationType,
        public readonly theme: string,
        public readonly coefficient: number,
        public readonly value: number | null,
        public readonly status: GradeStatus,
        public readonly absenceReason?: string
    ) {}

    /**
     * Indicates whether the grade has been assigned.
     * @return True if the grade is assigned, false otherwise.
     */
    get isGraded(): boolean {
        return this.status === 'graded';
    }

    /**
     * Indicates whether the student was absent for the evaluation.
     * @return True if the student was absent, false otherwise.
     */
    get isAbsent(): boolean {
        return this.status === 'absent';
    }

    /**
     * Converts the Grade instance to a JSON object.
     * @returns A JSON representation of the Grade instance.
     */
    toJSON(): Record<string, any> {
        return {
            teacher: this.teacher,
            teacherInitials: this.teacherInitials,
            date: this.date.toISOString(),
            type: this.type,
            theme: this.theme,
            coefficient: this.coefficient,
            value: this.value,
            status: this.status,
            absenceReason: this.absenceReason,
            isAbsent: this.isAbsent,
            isGraded: this.isGraded,
        };
    }
}
