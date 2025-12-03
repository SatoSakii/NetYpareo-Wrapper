import { AttendRecord } from "./AttendRecord";
import { Summary } from "./Summary";

export class Report {
	/**
	 * Creates a new Report instance.
	 * @param summary - The attendance summary.
	 * @param records - The list of attendance records.
	 * @param periodStart - The start date of the attendance period.
	 * @param periodEnd - The end date of the attendance period.
	 */
	constructor(
		public readonly summary: Summary,
		public readonly records: AttendRecord[],
		public readonly periodStart: string,
		public readonly periodEnd: string
	) {}

	/**
	 * Gets all absence records.
	 * @return An array of absence AttendRecord instances.
	 */
	get absences(): AttendRecord[] {
		return this.records.filter(record => record.isAbsence);
	}

	/**
	 * Gets all late arrival records.
	 * @return An array of late arrival AttendRecord instances.
	 */
	get lates(): AttendRecord[] {
		return this.records.filter(record => record.isLate);
	}

	/**
	 * Gets all early departure records.
	 * @return An array of early departure AttendRecord instances.
	 */
	get earlyDepartures(): AttendRecord[] {
		return this.records.filter(record => record.isEarlyDeparture);
	}

	/**
	 * Gets all justified records.
	 * @return An array of justified AttendRecord instances.
	 */
	get justified(): AttendRecord[] {
		return this.records.filter(record => record.isJustified);
	}

	/**
	 * Gets all unjustified records.
	 * @return An array of unjustified AttendRecord instances.
	 */
	get unjustified(): AttendRecord[] {
		return this.records.filter(record => !record.isJustified);
	}

	/**
	 * Converts the Report instance to a JSON object.
	 * @return A JSON representation of the Report instance.
	 */
	toJSON(): Record<string, any> {
		return {
			summary: this.summary.toJSON(),
			records: this.records.map(record => record.toJSON()),
			totalRecords: this.records.length,
			periodStart: this.periodStart,
			periodEnd: this.periodEnd
		};
	}
}