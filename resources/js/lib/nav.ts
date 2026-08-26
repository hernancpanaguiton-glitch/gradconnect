import { User } from '@/types';
import {
    Activity,
    BarChart2,
    Bell,
    Briefcase,
    Building2,
    Calendar,
    ClipboardList,
    Cpu,
    Database,
    FileText,
    FolderKanban,
    GraduationCap,
    LayoutDashboard,
    Layers,
    Lightbulb,
    LifeBuoy,
    ListChecks,
    Megaphone,
    Settings,
    Shield,
    Star,
    Target,
    TrendingUp,
    User as UserIcon,
    Users,
    type LucideIcon,
} from 'lucide-react';

export interface NavItem {
    label: string;
    href: string;
    icon: LucideIcon;
    badge?: number;
}

export interface NavSection {
    title?: string;
    items: NavItem[];
}

/** Human-readable role label shown in the sidebar. */
export const ROLE_LABELS: Record<string, string> = {
    admin: 'Admin',
    alumni_affairs: 'Alumni Affairs',
    department_head: 'Department Head',
    industry_partner: 'Industry Partner',
    alumni: 'Alumni',
    student: 'Graduate Student',
    sao: 'Student Affairs Office',
};

const dashboard: NavItem = { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard };

export function getNavFor(user: User): NavSection[] {
    if (user.roles.includes('admin')) {
        return [
            { items: [dashboard] },
            {
                title: 'Administration',
                items: [
                    { label: 'User Management', href: '/admin/users', icon: Users },
                    { label: 'Roles & Permissions', href: '/admin/roles', icon: Shield },
                    { label: 'Job Management', href: '/admin/jobs', icon: Briefcase },
                    { label: 'Tracer Surveys', href: '/surveys', icon: ListChecks },
                    { label: 'Announcements', href: '/announcements', icon: Megaphone },
                ],
            },
            {
                title: 'System',
                items: [
                    { label: 'Reports', href: '/reports/employability', icon: BarChart2 },
                    { label: 'Reports Hub', href: '/reports', icon: FolderKanban },
                    { label: 'Audit Logs', href: '/admin/audit-logs', icon: Activity },
                    { label: 'Platform Status', href: '/admin/platform-status', icon: Cpu },
                    { label: 'Data & Backups', href: '/admin/backups', icon: Database },
                    { label: 'System Settings', href: '/admin/settings', icon: Settings },
                    { label: 'Skill Taxonomy', href: '/skill-taxonomy', icon: Layers },
                ],
            },
        ];
    }

    if (user.roles.includes('alumni_affairs')) {
        return [
            { items: [dashboard] },
            {
                title: 'Alumni Management',
                items: [
                    { label: 'Alumni Database', href: '/talent-search', icon: Database },
                    { label: 'Tracer Survey', href: '/surveys', icon: ListChecks },
                    { label: 'Employability Reports', href: '/reports/employability', icon: BarChart2 },
                    { label: 'Reports Hub', href: '/reports', icon: FolderKanban },
                    { label: 'Announcements', href: '/announcements', icon: Megaphone },
                    { label: 'Learning Resources', href: '/learning-resources', icon: Lightbulb },
                    { label: 'Skill Taxonomy', href: '/skill-taxonomy', icon: Layers },
                    { label: 'Alumni Events', href: '/events', icon: Calendar },
                    { label: 'Alumni Community', href: '/community', icon: Users },
                    { label: 'Messages', href: '/messages', icon: Bell },
                    { label: 'Settings', href: '/settings', icon: Settings },
                ],
            },
        ];
    }

    if (user.roles.includes('department_head')) {
        return [
            { items: [dashboard] },
            {
                title: 'Analytics',
                items: [
                    { label: 'Employment Statistics', href: '/reports/employability', icon: BarChart2 },
                    // Department-scoped skill-gap/curriculum analytics (FDD Department Head
                    // box) — a different feature from the individual graduate-facing
                    // /skill-gap page (manuscript Figure 29 — actors: Alumni, Graduate
                    // Student only).
                    { label: 'Program Outcomes', href: '/reports/program-outcomes', icon: Target },
                    { label: 'Reports Hub', href: '/reports', icon: FolderKanban },
                    { label: 'Settings', href: '/settings', icon: Settings },
                ],
            },
        ];
    }

    if (user.roles.includes('sao')) {
        return [
            { items: [dashboard] },
            {
                title: 'Student Affairs',
                items: [
                    { label: 'Student Records', href: '/talent-search', icon: Users },
                    { label: 'Career Readiness', href: '/career-readiness', icon: Target },
                    { label: 'Scholarships', href: '/scholarships', icon: GraduationCap },
                    { label: 'Student Events', href: '/events', icon: Calendar },
                    { label: 'Clearance & Records', href: '/clearance', icon: ListChecks },
                    { label: 'Student Concerns', href: '/student-cases', icon: LifeBuoy },
                    { label: 'Student Analytics', href: '/reports/employability', icon: BarChart2 },
                    { label: 'Reports Hub', href: '/reports', icon: FolderKanban },
                    { label: 'Settings', href: '/settings', icon: Settings },
                ],
            },
        ];
    }

    if (user.roles.includes('industry_partner')) {
        return [
            { items: [dashboard] },
            {
                title: 'Recruiting',
                items: [
                    { label: 'My Company', href: '/company/edit', icon: Building2 },
                    { label: 'Job Postings', href: '/postings', icon: Briefcase },
                    { label: 'Talent Search', href: '/talent-search', icon: Users },
                    { label: 'Messages', href: '/messages', icon: Bell },
                    { label: 'Settings', href: '/settings', icon: Settings },
                ],
            },
        ];
    }

    if (user.roles.includes('student')) {
        return [
            { items: [dashboard] },
            {
                title: 'Career',
                items: [
                    { label: 'My Profile', href: '/graduate/profile/edit', icon: UserIcon },
                    { label: 'My Resumes', href: '/graduate/resumes', icon: FileText },
                    { label: 'AI Resume Analysis', href: '/resume-analysis', icon: FileText },
                    { label: 'Jobs & Internships', href: '/jobs', icon: Briefcase },
                    { label: 'My Applications', href: '/applications', icon: FolderKanban },
                    { label: 'Recommendations', href: '/recommendations', icon: Star },
                    { label: 'Skill Gap Analysis', href: '/skill-gap', icon: Target },
                    { label: 'Career Readiness', href: '/career-readiness', icon: Activity },
                    { label: 'Career Progression', href: '/career-progression', icon: TrendingUp },
                    { label: 'Guidance Resources', href: '/learning-resources', icon: Lightbulb },
                    { label: 'Reports Hub', href: '/reports', icon: FolderKanban },
                    { label: 'Messages', href: '/messages', icon: Bell },
                    { label: 'Student Concerns', href: '/student-cases', icon: LifeBuoy },
                    { label: 'Surveys', href: '/surveys', icon: ClipboardList },
                    { label: 'Settings', href: '/settings', icon: Settings },
                ],
            },
        ];
    }

    // Alumni (default graduate).
    return [
        { items: [dashboard] },
        {
            title: 'My Career',
            items: [
                { label: 'My Profile', href: '/graduate/profile/edit', icon: UserIcon },
                { label: 'My Resumes', href: '/graduate/resumes', icon: FileText },
                { label: 'AI Resume Analysis', href: '/resume-analysis', icon: Target },
                { label: 'Job Board', href: '/jobs', icon: Briefcase },
                { label: 'My Applications', href: '/applications', icon: FolderKanban },
                { label: 'Recommendations', href: '/recommendations', icon: Star },
                // Manuscript Figure 29 lists Alumni as an actor for skill gap
                // analysis, but this was only ever in the student nav.
                { label: 'Skill Gap Analysis', href: '/skill-gap', icon: Target },
                { label: 'Career Progression', href: '/career-progression', icon: TrendingUp },
                { label: 'Reports Hub', href: '/reports', icon: FolderKanban },
                { label: 'Alumni Community', href: '/community', icon: Users },
                { label: 'Messages', href: '/messages', icon: Bell },
                { label: 'Surveys', href: '/surveys', icon: ClipboardList },
                { label: 'Settings', href: '/settings', icon: Settings },
            ],
        },
    ];
}
