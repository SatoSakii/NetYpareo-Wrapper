export class Metadata {
    /**
     * Creates a new Metadata instance.
     * @param subjectCode - The code of the subject.
     * @param coefficient - The coefficient of the subject.
     * @param groupCodes - The group codes associated with the subject.
     */
    constructor(
        public readonly subjectCode: number,
        public readonly coefficient: number,
        public readonly groupCodes: number[]
    ) {}

    /**
     * Converts the Metadata instance to a JSON object.
     * @returns A JSON representation of the Metadata instance.
     */
    toJSON(): Record<string, number | number[]> {
        return {
            subjectCode: this.subjectCode,
            coefficient: this.coefficient,
            groupCodes: this.groupCodes,
        }
    }
}
