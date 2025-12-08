import * as cheerio from 'cheerio';

import { Registration } from '../..';
import type { UserData } from '../types';
import { normalizeText } from './utils';

/**
 * Parses a user profile HTML and extracts user data.
 * @param html - The HTML content of the user profile page.
 * @param username - The username of the user.
 * @returns An object containing the user's data.
 */
export function parseUser(html: string, username: string): UserData {
    const $ = cheerio.load(html);
    const $label = $('.user-info-label').first();

    let rawFull: string | null = null;
    if ($label.length)
        rawFull =
            $label.clone().children().remove().end().text().trim() || null;

    const fullName = normalizeText(rawFull) || undefined;
    const registrations = parseRegistrations($);

    return {
        username,
        fullName,
        avatarUrl: undefined,
        registrations,
    };
}

function parseRegistrations($: cheerio.CheerioAPI): Registration[] {
    const registrations: Registration[] = [];
    const seen = new Set<number>();

    const selectors = [
        'select[name="codeInscription"] option',
        'a[href*="/bulletin/"]',
        'a[href*="/assiduite/"]',
        'a[href*="/calendrier/"]',
    ];

    selectors.forEach(selector => {
        $(selector).each((_, elem) => {
            const $elem = $(elem);
            let code: number | null = null;
            let name = '';
            let year = '';

            if (selector.includes('select')) {
                code = parseInt($elem.attr('value') || '0');
                name = $elem.text().trim();
            } else {
                const href = $elem.attr('href') || '';
                const match = href.match(/\/(\d{7})\/(\d{7})\//);

                if (match) {
                    code = parseInt(match[2]);
                    name = $elem
                        .closest('.block')
                        .find('.block-toolbar h3, .category-header-title')
                        .first()
                        .text()
                        .trim();
                }
            }

            const yearMatch = name.match(/\((\d{4}-\d{4})\)/);
            if (yearMatch) year = yearMatch[1];

            if (code && !seen.has(code)) {
                seen.add(code);
                registrations.push(
                    new Registration(code, name || `Inscription ${code}`, year)
                );
            }
        });
    });

    if (registrations.length === 0) {
        const scriptContent = $('script').text();
        const match = scriptContent.match(/codeApprenant\s*=\s*(\d+)/);

        if (match) {
            const code = parseInt(match[1]);
            registrations.push(
                new Registration(code, `Inscription ${code}`, '')
            );
        }
    }

    return registrations;
}
