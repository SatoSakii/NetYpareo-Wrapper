export class Registration {
    /**
     * Create a new Registration instance.
     * @param code The registration code.
     * @param name The registration name.
     * @param year The academic year.
     */
    constructor(
        public readonly code: number,
        public readonly name: string,
        public readonly year: string
    ) {}

    /**
     * Returns a string representation of the Registration.
     * @return The registration name and year.
     */
    toString(): string {
        return this.year ? `${this.name} (${this.year})` : this.name;
    }

    /**
     * Converts the Registration instance to a JSON object.
     * @returns A JSON representation of the Registration instance.
     */
    toJSON(): Record<string, any> {
        return {
            code: this.code,
            name: this.name,
            year: this.year,
        };
    }
}
