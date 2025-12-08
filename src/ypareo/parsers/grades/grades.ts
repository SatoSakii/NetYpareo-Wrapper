import * as cheerio from 'cheerio';

import type { EvaluationType, GradeStatus } from '../../models';
import {
    Grade,
    GradeReport,
    Period,
    Subject,
    SubjectStats,
} from '../../models';
import { parseDate } from '../../utils/Date';

/**
 * Parses the grades report from the given HTML.
 * @param html - The HTML string containing the grades report.
 * @returns A GradeReport object representing the parsed grades.
 */
export function parseGrades(html: string): GradeReport {
    const $ = cheerio.load(html);

    const periodName =
        $('.content-informations-subtitle').text().trim() || 'Current Period';
    const registrationName =
        periodName.match(/l'inscription (.+)$/)?.[1] || 'Current Registration';

    const subjects: Subject[] = [];

    $('.liste-devoirs-par-matiere').each((_, subjectElem) => {
        const $subject = $(subjectElem);
        const subjectCode = parseInt($subject.attr('data-code-matiere') || '0');
        const subjectName = $subject
            .find('.category-header-title')
            .text()
            .trim();

        const grades = parseGradesTable($, $subject);
        const stats = parseStats($, $subject);
        const comment = parseComment($, $subject);

        subjects.push(
            new Subject(subjectCode, subjectName, grades, stats, comment)
        );
    });

    return new GradeReport(subjects, periodName, registrationName);
}

/**
 * Parses the available grading periods from the HTML.
 * @param html - The HTML string containing the periods.
 * @returns An array of Period objects.
 */
export function parseAvailablePeriods(html: string): Period[] {
    const $ = cheerio.load(html);
    const periods: Period[] = [];

    $('select[name="code-periode-evaluation"] option').each((_, option) => {
        const $option = $(option);
        const code = parseInt($option.attr('value') || '0');
        const sessionCodeAttr = $option.attr('data-code-session');
        const name = $option.text().trim();

        if (isNaN(code)) return;

        const sessionCode = sessionCodeAttr ? parseInt(sessionCodeAttr) : null;

        periods.push(new Period(code, name, sessionCode));
    });

    return periods;
}

function parseGradesTable(
    $: cheerio.CheerioAPI,
    $subject: cheerio.Cheerio<any>
): Grade[] {
    const grades: Grade[] = [];

    $subject.find('tbody.table-body tr').each((_, row) => {
        const $cells = $(row).find('td');

        const $teacherCell = $cells.eq(0);
        const teacherInitials = $teacherCell
            .find('.tag-initiales')
            .text()
            .trim();
        const teacherFull =
            $teacherCell.find('.tag-initiales').attr('data-tooltip-content') ||
            '';
        const dateText = $teacherCell.text().trim();
        const dateMatch = dateText.match(/le (\d{2}\/\d{2}\/\d{4})/);

        if (!dateMatch) return;

        const date = parseDate(dateMatch[1]);

        const typeText = $cells.eq(1).text().trim();
        const type = determineEvaluationType(typeText);

        const themeText =
            $cells.eq(2).find('.cursor-help').attr('data-tooltip-content') ||
            $cells.eq(2).text().trim();

        const coeffStr = $cells.eq(3).text().trim();
        const coefficient =
            coeffStr ? parseFloat(coeffStr.replace(',', '.')) : 1;

        const $gradeCell = $cells.eq(4);
        const gradeText = $gradeCell.text().trim();

        let value: number | null = null;
        let status: GradeStatus = 'not_graded';
        let absenceReason: string | undefined;

        if ($gradeCell.find('span[data-tooltip-content]').length > 0) {
            status = 'absent';
            absenceReason =
                $gradeCell.find('span').attr('data-tooltip-content') ||
                gradeText;
        } else if (
            gradeText &&
            !isNaN(parseFloat(gradeText.replace(',', '.')))
        ) {
            value = parseFloat(gradeText.replace(',', '.'));
            status = 'graded';
        }

        grades.push(
            new Grade(
                teacherFull,
                teacherInitials,
                date,
                type,
                themeText,
                coefficient,
                value,
                status,
                absenceReason
            )
        );
    });

    return grades;
}

function parseStats(
    $: cheerio.CheerioAPI,
    $subject: cheerio.Cheerio<any>
): SubjectStats {
    const statsTable = $subject.find('.section-content table tbody tr');

    let studentAverage: number | null = null;
    let groupAverage: number | null = null;
    let minAverage: number | null = null;
    let maxAverage: number | null = null;

    statsTable.each((_, row) => {
        const $row = $(row);
        const label = $row.find('td').first().text().trim();
        const valueText = $row.find('td').last().text().trim();

        if (valueText === '-') return;

        const value = parseFloat(valueText.replace(',', '.'));

        if (isNaN(value)) return;

        if (label.includes("Moyenne de l'apprenant")) studentAverage = value;
        else if (label.includes('Moyenne du groupe')) groupAverage = value;
        else if (label.includes('Moyenne minimale')) minAverage = value;
        else if (label.includes('Moyenne maximale')) maxAverage = value;
    });

    return new SubjectStats(
        studentAverage,
        groupAverage,
        minAverage,
        maxAverage
    );
}

function parseComment(
    $: cheerio.CheerioAPI,
    $subject: cheerio.Cheerio<any>
): string | undefined {
    const commentText = $subject
        .find('.section-title:contains("Appréciation")')
        .next('.section-content')
        .find('p')
        .text()
        .trim();

    if (!commentText || commentText === 'Aucune appréciation renseignée.')
        return undefined;

    return commentText;
}

function determineEvaluationType(typeText: string): EvaluationType {
    const lower = typeText.toLowerCase();

    if (lower.includes('écrit') || lower.includes('ecrit')) return 'written';
    if (lower.includes('oral')) return 'oral';
    if (lower.includes('pratique') || lower.includes('tp')) return 'practical';

    return 'other';
}
