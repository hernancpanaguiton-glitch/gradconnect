/**
 * Placeholder datasets for the dashboard charts, ported from the Figma design.
 * These drive the static shells until the charts are wired to real data.
 */

export const employmentTrend = [
    { month: 'Jan', employed: 68, unemployed: 32 },
    { month: 'Feb', employed: 72, unemployed: 28 },
    { month: 'Mar', employed: 75, unemployed: 25 },
    { month: 'Apr', employed: 79, unemployed: 21 },
    { month: 'May', employed: 82, unemployed: 18 },
    { month: 'Jun', employed: 86, unemployed: 14 },
];

export const placementByProgram = [
    { dept: 'IT', rate: 91 },
    { dept: 'Business', rate: 84 },
    { dept: 'Nursing', rate: 96 },
    { dept: 'Engineering', rate: 88 },
    { dept: 'Education', rate: 79 },
    { dept: 'Accountancy', rate: 87 },
];

export const industryDistribution = [
    { name: 'IT & Tech', value: 32, color: '#1a56db' },
    { name: 'Healthcare', value: 24, color: '#0ea5e9' },
    { name: 'Finance', value: 18, color: '#10b981' },
    { name: 'Education', value: 14, color: '#f59e0b' },
    { name: 'Others', value: 12, color: '#8b5cf6' },
];

export const skillRadar = [
    { skill: 'JavaScript', you: 80, market: 90 },
    { skill: 'React', you: 75, market: 88 },
    { skill: 'SQL', you: 60, market: 75 },
    { skill: 'Python', you: 45, market: 82 },
    { skill: 'Cloud', you: 30, market: 70 },
    { skill: 'UI/UX', you: 65, market: 60 },
];

export const applicationFunnel = [
    { month: 'Jan', applied: 4, interview: 2, offer: 1 },
    { month: 'Feb', applied: 6, interview: 3, offer: 1 },
    { month: 'Mar', applied: 8, interview: 4, offer: 2 },
    { month: 'Apr', applied: 5, interview: 2, offer: 0 },
    { month: 'May', applied: 9, interview: 5, offer: 3 },
    { month: 'Jun', applied: 7, interview: 4, offer: 2 },
];
