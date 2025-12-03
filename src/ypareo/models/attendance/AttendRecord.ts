import type { RecordType, RecordStatus } from './types';

export class AttendRecord {
	/**
	 * Creates a new AttendRecord instance.
	 * @param startDate - The start date and time of the record.
	 * @param endDate - The end date and time of the record.
	 * @param durationMinutes - The duration of the record in minutes.
	 * @param reason - The reason for the record.
	 * @param detail - Additional details about the record.
	 * @param status - The status of the record (justified or unjustified).
	 * @param type - The type of the record (absence, late, early departure).
	 */
	constructor(
		public readonly startDate: Date,
		public readonly endDate: Date,
		public readonly durationMinutes: number,
		public readonly reason: string,
		public readonly detail: string,
		public readonly status: RecordStatus,
		public readonly type: RecordType
	) {}

	/**
	 * Gets the duration of the record in hours, rounded to two decimal places.
	 * @return The duration in hours.
	 */
	get durationHours(): number {
		return Math.round((this.durationMinutes / 60) * 100) / 100;
	}

	/**
	 * Checks if the record is justified.
	 * @return True if the record is justified, false otherwise.
	 */
	get isJustified(): boolean {
		return this.status === 'justified';
	}

	/**
	 * Checks if the record is an absence.
	 * @return True if the record is an absence, false otherwise.
	 */
	get isAbsence(): boolean {
		return this.type === 'absence';
	}

	/**
	 * Checks if the record is a late arrival.
	 * @return True if the record is a late arrival, false otherwise.
	 */
	get isLate(): boolean {
		return this.type === 'late';
	}

	/**
	 * Checks if the record is an early departure.
	 * @return True if the record is an early departure, false otherwise.
	 */
	get isEarlyDeparture(): boolean {
		return this.type === 'early_departure';
	}

	/**
	 * Converts the Record instance to a JSON object.
	 * @returns A JSON representation of the Record instance.
	 */
	toJSON(): Record<string, any> {
		return {
			startDate: this.startDate.toISOString(),
			endDate: this.endDate.toISOString(),
			durationMinutes: this.durationMinutes,
			durationHours: this.durationHours,
			reason: this.reason,
			detail: this.detail,
			status: this.status,
			type: this.type,
			isJustified: this.isJustified
		};
	}
}