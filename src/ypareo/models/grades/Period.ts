export class Period {
	/**
	 * Creates a new Period instance.
	 * @param code - The period code.
	 * @param name - The period name.
	 * @param sessionCode - The session code, if applicable.
	 */
	constructor(
		public readonly code: number,
		public readonly name: string,
		public readonly sessionCode: number | null
	) {}

	/**
	 * Indicates whether the period represents a full academic year.
	 * @return True if the period is a full year, false otherwise.
	 */
	get isFullYear(): boolean {
		return this.code === -1;
	}

	/**
	 * Gets the academic year associated with the period.
	 * @return The academic year in "YYYY-YYYY" format, or null if not applicable.
	 */
	get year(): string | null {
		const match = this.name.match(/\((\d{4}-\d{4})\)/);

		return match ? match[1] : null;
	}

	/**
	 * Converts the Period instance to a JSON object.
	 * @returns A JSON representation of the Period instance.
	 */
	toJSON(): Record<string, any> {
		return {
			code: this.code,
			name: this.name,
			sessionCode: this.sessionCode,
			year: this.year,
			isFullYear: this.isFullYear
		};
	}
}