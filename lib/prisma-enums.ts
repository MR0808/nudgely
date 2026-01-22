export const TeamRole = {
    TEAM_ADMIN: 'TEAM_ADMIN',
    TEAM_MEMBER: 'TEAM_MEMBER'
} as const;

export type TeamRole = (typeof TeamRole)[keyof typeof TeamRole];

export const Gender = {
    MALE: 'MALE',
    FEMALE: 'FEMALE',
    OTHER: 'OTHER',
    NOTSAY: 'NOTSAY'
} as const;

export type Gender = (typeof Gender)[keyof typeof Gender];

export const TemplateCategory = {
    TEAM: 'TEAM',
    FINANCE: 'FINANCE',
    PRODUCTIVITY: 'PRODUCTIVITY',
    LEADERSHIP: 'LEADERSHIP',
    OPERATIONS: 'OPERATIONS',
    MARKETING: 'MARKETING',
    HR: 'HR',
    ADMIN: 'ADMIN',
    PR: 'PR',
    PERSONAL: 'PERSONAL',
    PROJECTMANAGEMENT: 'PROJECTMANAGEMENT',
    REPORTS: 'REPORTS',
    EVENTS: 'EVENTS',
    MEETINGS: 'MEETINGS',
    OTHER: 'OTHER'
} as const;

export type TemplateCategory =
    (typeof TemplateCategory)[keyof typeof TemplateCategory];
