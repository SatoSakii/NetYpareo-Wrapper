import type { WeekCode } from '../models';

/**
 * Gets the week code for a given date.
 * @param date - The date to get the week code for.
 * @returns The week code.
 */
export function getWeekCode(date: Date): WeekCode {
	const tmpDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));

	const dayNum = tmpDate.getUTCDay() || 7;
	tmpDate.setUTCDate(tmpDate.getUTCDate() + 4 - dayNum);

	const yearStart = new Date(Date.UTC(tmpDate.getUTCFullYear(), 0, 1));
	const weekNum = Math.ceil((((tmpDate.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
	const year = date.getFullYear();
	const weekStr = weekNum.toString().padStart(2, '0');

	return parseInt(`${year}${weekStr}`);
}

/**
 * Gets the current week code.
 * @returns The current week code.
 */
export function getCurrentWeekCode(): WeekCode {
	return getWeekCode(new Date());
}