import * as cheerio from 'cheerio';
import { Report, Summary, AttendRecord } from '../../models/attendance';
import type { RecordType, RecordStatus } from '../../models/attendance';

/**
 * Parses the attendance HTML and returns a Report object.
 * @param html - The attendance HTML string.
 * @returns A Report object containing the parsed attendance data.
 */
export function parseAttendance(html: string): Report {
	const $ = cheerio.load(html);

	const summary = parseSummary($);
	const period = parsePeriod($);
	const records = parseRecords($);

	return new Report(summary, records, period.start, period.end);
}

function parseSummary($: cheerio.CheerioAPI): Summary {
	const tables = $('.section table');

	let absencesMinutes = 0;
	let latesMinutes = 0;
	let earlyDeparturesMinutes = 0;
	let justifiedMinutes = 0;
	let unjustifiedMinutes = 0;

	tables.first().find('tr').each((_, row) => {
		const $row = $(row);
		const label = $row.find('th').text().trim();
		const value = $row.find('td').text().trim();
		const minutes = parseTimeToMinutes(value);

		if (label.includes('Absences'))
			absencesMinutes = minutes;
		else if (label.includes('Retards'))
			latesMinutes = minutes;
		else if (label.includes('Départs anticipés'))
			earlyDeparturesMinutes = minutes;
	});

	tables.eq(1).find('tr').each((_, row) => {
		const $row = $(row);
		const label = $row.find('th').text().trim();
		const value = $row.find('td').text().trim();
		const minutes = parseTimeToMinutes(value);

		if (label.includes('Justifiées'))
			justifiedMinutes = minutes;
		else if (label.includes('Injustifiées'))
			unjustifiedMinutes = minutes;
	});

	return new Summary(
		absencesMinutes,
		latesMinutes,
		earlyDeparturesMinutes,
		justifiedMinutes,
		unjustifiedMinutes
	);
}

function parsePeriod($: cheerio.CheerioAPI): { start: string; end: string } {
	const title = $('.category-header-title').first().text();
	const match = title.match(/du (\d{2}\/\d{2}\/\d{4}) au (\d{2}\/\d{2}\/\d{4})/);

	return {
		start: match?.[1] || '',
		end: match?.[2] || ''
	};
}

function parseRecords($: cheerio.CheerioAPI): AttendRecord[] {
	const records: AttendRecord[] = [];

	$('.table-striped-decorator tbody tr').each((_, row) => {
		const $cells = $(row).find('td');

		const startDateStr = $cells.eq(0).text().trim();
		const endDateStr = $cells.eq(1).text().trim();
		const durationStr = $cells.eq(2).text().trim();
		let reason = $cells.eq(3).text().trim();
		const detail = $cells.eq(4).text().trim();

		const isJustified = $cells.eq(2).hasClass('text-green');
		const status: RecordStatus = isJustified ? 'justified' : 'unjustified';
		const type = determineType(detail);

		const durationMinutes = parseTimeToMinutes(durationStr);
		const startDate = parseDate(startDateStr);
		const endDate = parseDate(endDateStr);

		if (type === 'late')
			reason = reason.replace(/Absence/g, 'Retard');

		records.push(
			new AttendRecord(
				startDate,
				endDate,
				durationMinutes,
				reason,
				detail,
				status,
				type
			)
		);
	});

	return records;
}

function determineType(detail: string): RecordType {
	const lower = detail.toLowerCase();

	if (lower.includes('absence'))
		return 'absence';
	if (lower.includes('retard'))
		return 'late';
	return 'early_departure';
}

function parseTimeToMinutes(timeStr: string): number {
	const match = timeStr.match(/(\d+)h(\d+)/);

	if (!match)
		return 0;

	const hours = parseInt(match[1], 10);
	const minutes = parseInt(match[2], 10);
	return hours * 60 + minutes;
}

function parseDate(dateStr: string): Date {
	const [day, month, year] = dateStr.split('/').map(Number);

	return new Date(year, month - 1, day);
}