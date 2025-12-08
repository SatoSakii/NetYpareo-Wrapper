export const DAYS = {
    SUNDAY: 0,
    MONDAY: 1,
    TUESDAY: 2,
    WEDNESDAY: 3,
    THURSDAY: 4,
    FRIDAY: 5,
    SATURDAY: 6,
};

export const DAY_NAMES: Record<number, string> = {
    [DAYS.SUNDAY]: 'sunday',
    [DAYS.MONDAY]: 'monday',
    [DAYS.TUESDAY]: 'tuesday',
    [DAYS.WEDNESDAY]: 'wednesday',
    [DAYS.THURSDAY]: 'thursday',
    [DAYS.FRIDAY]: 'friday',
    [DAYS.SATURDAY]: 'saturday',
};

export const RESOURCE_TYPES = {
    STUDENT: 7500,
    TEACHER: 7000,
    ROOM: 6500,
    GROUP: 5000,
} as const;

export const SESSION_TYPES = {
    COURSE: 81500,
    TP: 81501,
    TD: 81502,
} as const;

export const EXPORT_MODES = {
    CALENDAR: 'calendrier',
    DETAILED: 'detaille',
    DETAILED_MONTHLY: 'detaille-mensuel',
} as const;

export const MINUTES_PER_HOUR = 60;
export const MINUTES_PER_DAY = 1440;
export const FULL_DAY_THRESHOLD = 1439;
