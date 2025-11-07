import { PrismaClient, TemplateCategory, TemplateTier } from '@prisma/client';
import GithubSlugger from 'github-slugger';

const templates = [
    // 🆓 FREE
    {
        name: 'Weekly Team Check-In',
        description:
            'Remind your team every Monday morning to share updates, priorities, and blockers.',
        category: TemplateCategory.TEAM,
        tier: TemplateTier.FREE,
        slug: 'weekly-team-check-in'
    },
    {
        name: 'Monthly Expense Report',
        description:
            'Prompt the finance team to submit monthly expense claims before the deadline.',
        category: TemplateCategory.FINANCE,
        tier: TemplateTier.FREE,
        slug: 'monthly-expense-report'
    },
    {
        name: 'Friday Wrap-Up',
        description:
            'Send a Friday reminder to reflect on wins, lessons, and plans for next week.',
        category: TemplateCategory.PRODUCTIVITY,
        tier: TemplateTier.FREE,
        slug: 'friday-wrap-up'
    },
    {
        name: 'Quarterly Goal Review',
        description:
            'Encourage managers to review OKRs and performance metrics at the end of each quarter.',
        category: TemplateCategory.LEADERSHIP,
        tier: TemplateTier.FREE,
        slug: 'quarterly-goal-review'
    },
    {
        name: 'System Backup Check',
        description:
            'Remind IT to verify that all critical systems and databases have been backed up successfully.',
        category: TemplateCategory.OPERATIONS,
        tier: TemplateTier.FREE,
        slug: 'system-backup-check'
    },

    // 💼 TEAM
    {
        name: 'Daily Standup Reminder',
        description:
            'Remind your team each morning to post their daily update asynchronously.',
        category: TemplateCategory.TEAM,
        tier: TemplateTier.PRO,
        slug: 'daily-standup-reminder'
    },
    {
        name: 'Project Status Update',
        description:
            'Request progress updates from project owners every Wednesday.',
        category: TemplateCategory.TEAM,
        tier: TemplateTier.PRO,
        slug: 'project-status-update'
    },
    {
        name: 'Monthly Team Retrospective',
        description:
            'Prompt your team to share one win, one challenge, and one improvement idea.',
        category: TemplateCategory.TEAM,
        tier: TemplateTier.PRO,
        slug: 'monthly-team-retrospective'
    },
    {
        name: 'New Hire Check-In',
        description:
            'Remind managers to check in with new hires after their first week and month.',
        category: TemplateCategory.TEAM,
        tier: TemplateTier.PRO,
        slug: 'new-hire-check-in'
    },
    {
        name: 'Onboarding Task Review',
        description:
            'Ensure all onboarding tasks (accounts, access, equipment) are completed for new hires.',
        category: TemplateCategory.TEAM,
        tier: TemplateTier.PRO,
        slug: 'onboarding-task-review'
    },
    {
        name: 'Performance Review Reminder',
        description:
            'Remind managers and staff to complete quarterly performance reviews.',
        category: TemplateCategory.TEAM,
        tier: TemplateTier.PRO,
        slug: 'performance-review-reminder'
    },
    {
        name: 'Employee Anniversary Nudge',
        description:
            'Celebrate team members’ work anniversaries with a simple acknowledgment.',
        category: TemplateCategory.TEAM,
        tier: TemplateTier.PRO,
        slug: 'employee-anniversary-nudge'
    },
    {
        name: 'Weekly Department Update',
        description:
            'Ask department heads to share weekly wins and updates with the broader team.',
        category: TemplateCategory.TEAM,
        tier: TemplateTier.PRO,
        slug: 'weekly-department-update'
    },

    // 📊 FINANCE
    {
        name: 'Payroll Submission Reminder',
        description:
            'Notify HR or finance to submit payroll for processing before cutoff.',
        category: TemplateCategory.FINANCE,
        tier: TemplateTier.PRO,
        slug: 'payroll-submission-reminder'
    },
    {
        name: 'Invoice Follow-Up',
        description:
            'Remind accounting to follow up on outstanding invoices every two weeks.',
        category: TemplateCategory.FINANCE,
        tier: TemplateTier.PRO,
        slug: 'invoice-follow-up'
    },
    {
        name: 'Tax Preparation Reminder',
        description:
            'Prompt finance teams to review tax obligations ahead of filing deadlines.',
        category: TemplateCategory.FINANCE,
        tier: TemplateTier.PRO,
        slug: 'tax-preparation-reminder'
    },
    {
        name: 'Budget Review Meeting',
        description:
            'Schedule a recurring nudge for leadership to review budgets and forecasts.',
        category: TemplateCategory.FINANCE,
        tier: TemplateTier.PRO,
        slug: 'budget-review-meeting'
    },
    {
        name: 'Vendor Payment Reminder',
        description:
            'Remind accounts payable to process vendor payments before due dates.',
        category: TemplateCategory.FINANCE,
        tier: TemplateTier.PRO,
        slug: 'vendor-payment-reminder'
    },
    {
        name: 'Expense Policy Review',
        description:
            'Send quarterly reminders to review and update company expense policies.',
        category: TemplateCategory.FINANCE,
        tier: TemplateTier.PRO,
        slug: 'expense-policy-review'
    },

    // ⚙️ OPERATIONS
    {
        name: 'Weekly System Health Check',
        description:
            'Remind ops or IT teams to check logs, uptime, and alerts.',
        category: TemplateCategory.OPERATIONS,
        tier: TemplateTier.PRO,
        slug: 'weekly-system-health-check'
    },
    {
        name: 'Server Patch Reminder',
        description:
            'Send reminders to update security patches and dependencies.',
        category: TemplateCategory.OPERATIONS,
        tier: TemplateTier.PRO,
        slug: 'server-patch-reminder'
    },
    {
        name: 'Disaster Recovery Drill',
        description:
            'Quarterly simulation to ensure disaster recovery plans work as expected.',
        category: TemplateCategory.OPERATIONS,
        tier: TemplateTier.PRO,
        slug: 'disaster-recovery-drill'
    },
    {
        name: 'Inventory Restock Check',
        description:
            'Remind admin or supply teams to review office or production inventory.',
        category: TemplateCategory.OPERATIONS,
        tier: TemplateTier.PRO,
        slug: 'inventory-restock-check'
    },
    {
        name: 'Facility Safety Inspection',
        description:
            'Monthly reminder for facilities to conduct safety and compliance checks.',
        category: TemplateCategory.OPERATIONS,
        tier: TemplateTier.PRO,
        slug: 'facility-safety-inspection'
    },
    {
        name: 'Equipment Maintenance Check',
        description:
            'Send reminders for regular equipment inspection and maintenance tasks.',
        category: TemplateCategory.OPERATIONS,
        tier: TemplateTier.PRO,
        slug: 'equipment-maintenance-check'
    },

    // 📣 MARKETING & PR
    {
        name: 'Newsletter Send Reminder',
        description:
            'Prompt marketing teams to finalize and send the monthly newsletter.',
        category: TemplateCategory.MARKETING,
        tier: TemplateTier.PRO,
        slug: 'newsletter-send-reminder'
    },
    {
        name: 'Social Media Planning',
        description:
            'Remind your team to plan and schedule social posts for the upcoming week.',
        category: TemplateCategory.MARKETING,
        tier: TemplateTier.PRO,
        slug: 'social-media-planning'
    },
    {
        name: 'Campaign Performance Review',
        description: 'Nudge marketers to review campaign analytics and KPIs.',
        category: TemplateCategory.MARKETING,
        tier: TemplateTier.PRO,
        slug: 'campaign-performance-review'
    },
    {
        name: 'Customer Testimonial Follow-Up',
        description:
            'Remind CSMs or marketers to request new testimonials from recent clients.',
        category: TemplateCategory.MARKETING,
        tier: TemplateTier.PRO,
        slug: 'customer-testimonial-follow-up'
    },
    {
        name: 'Press Release Planning',
        description:
            'Schedule a recurring reminder for reviewing PR or blog topics.',
        category: TemplateCategory.PR,
        tier: TemplateTier.PRO,
        slug: 'press-release-planning'
    },
    {
        name: 'Ad Campaign Budget Check',
        description:
            'Prompt marketers to review ad spend and campaign ROI weekly.',
        category: TemplateCategory.MARKETING,
        tier: TemplateTier.PRO,
        slug: 'ad-campaign-budget-check'
    },
    {
        name: 'SEO Audit Reminder',
        description:
            'Remind your team to review site SEO performance and fix any technical issues.',
        category: TemplateCategory.MARKETING,
        tier: TemplateTier.PRO,
        slug: 'seo-audit-reminder'
    },

    // 🧠 PRODUCTIVITY & ADMIN
    {
        name: 'Weekly Planning Nudge',
        description:
            'Remind yourself every Monday to outline top goals for the week.',
        category: TemplateCategory.PRODUCTIVITY,
        tier: TemplateTier.PRO,
        slug: 'weekly-planning-nudge'
    },
    {
        name: 'Inbox Zero Reminder',
        description:
            'Encourage a quick inbox cleanup session every Friday afternoon.',
        category: TemplateCategory.ADMIN,
        tier: TemplateTier.PRO,
        slug: 'inbox-zero-reminder'
    },
    {
        name: 'Monthly File Clean-Up',
        description:
            'Prompt a tidy-up of your digital files or shared drives once a month.',
        category: TemplateCategory.ADMIN,
        tier: TemplateTier.PRO,
        slug: 'monthly-file-clean-up'
    },
    {
        name: 'Policy Update Reminder',
        description:
            'Send a quarterly nudge to review and update company policies.',
        category: TemplateCategory.ADMIN,
        tier: TemplateTier.PRO,
        slug: 'policy-update-reminder'
    },
    {
        name: 'Tool Access Review',
        description:
            'Remind admins to check user permissions and remove inactive accounts.',
        category: TemplateCategory.ADMIN,
        tier: TemplateTier.PRO,
        slug: 'tool-access-review'
    },
    {
        name: 'Daily Focus Nudge',
        description:
            'Send a morning reminder to set three key priorities for the day.',
        category: TemplateCategory.PRODUCTIVITY,
        tier: TemplateTier.PRO,
        slug: 'daily-focus-nudge'
    },
    {
        name: 'Monthly Reflection Prompt',
        description:
            'Encourage reflection on what worked and what could improve each month.',
        category: TemplateCategory.PRODUCTIVITY,
        tier: TemplateTier.PRO,
        slug: 'monthly-reflection-prompt'
    },
    {
        name: 'Task Cleanup Reminder',
        description:
            'Remind yourself to archive or delete completed tasks from your dashboard.',
        category: TemplateCategory.PRODUCTIVITY,
        tier: TemplateTier.PRO,
        slug: 'task-cleanup-reminder'
    },
    {
        name: 'Meeting Notes Follow-Up',
        description:
            'Send a reminder to document meeting outcomes and share them with your team.',
        category: TemplateCategory.PRODUCTIVITY,
        tier: TemplateTier.PRO,
        slug: 'meeting-notes-follow-up'
    },

    // 🧍 PERSONAL
    {
        name: 'Personal Finance Check-In',
        description:
            'Remind yourself to review bank balances, budgets, and upcoming bills.',
        category: TemplateCategory.PERSONAL,
        tier: TemplateTier.PRO,
        slug: 'personal-finance-check-in'
    },
    {
        name: 'Quarterly Reflection',
        description:
            'Encourage personal reflection on progress, goals, and new priorities.',
        category: TemplateCategory.PERSONAL,
        tier: TemplateTier.PRO,
        slug: 'quarterly-reflection'
    },
    {
        name: 'Weekly Learning Nudge',
        description:
            'Encourage yourself to dedicate 30 minutes each week to learning something new.',
        category: TemplateCategory.PERSONAL,
        tier: TemplateTier.PRO,
        slug: 'weekly-learning-nudge'
    },
    {
        name: 'Daily Gratitude Prompt',
        description:
            'Send a gentle nudge each morning to write down one thing you’re grateful for.',
        category: TemplateCategory.PERSONAL,
        tier: TemplateTier.PRO,
        slug: 'daily-gratitude-prompt'
    },
    {
        name: 'Fitness Check-In',
        description:
            'Remind yourself to log workouts or take a short walk each day.',
        category: TemplateCategory.PERSONAL,
        tier: TemplateTier.PRO,
        slug: 'fitness-check-in'
    },
    {
        name: 'Hydration Reminder',
        description:
            'A friendly nudge to stay hydrated throughout the workday.',
        category: TemplateCategory.PERSONAL,
        tier: TemplateTier.PRO,
        slug: 'hydration-reminder'
    },
    {
        name: 'Reading Habit Tracker',
        description: 'Encourage yourself to read a few pages of a book daily.',
        category: TemplateCategory.PERSONAL,
        tier: TemplateTier.PRO,
        slug: 'reading-habit-tracker'
    },
    {
        name: 'Weekly Meal Prep',
        description:
            'Remind yourself to plan and prep meals for the upcoming week.',
        category: TemplateCategory.PERSONAL,
        tier: TemplateTier.PRO,
        slug: 'weekly-meal-prep'
    },
    {
        name: 'Monthly Budget Review',
        description:
            'Prompt a monthly check of your personal budget and savings goals.',
        category: TemplateCategory.PERSONAL,
        tier: TemplateTier.PRO,
        slug: 'monthly-budget-review'
    }
];

const prisma = new PrismaClient();

const slugger = new GithubSlugger();

async function seedTemplates() {
    const totalLength = templates.length;
    let count = 1;
    console.log(totalLength);
    try {
        await prisma.globalTemplate.deleteMany();
        console.log('Seeding templates...');
        for (const template of templates) {
            let slug = slugger.slug(template.name);
            await prisma.globalTemplate.create({
                data: {
                    slug,
                    name: template.name,
                    description: template.description,
                    category: template.category,
                    tier: template.tier
                }
            });
            console.log(`Seeded ${count} / ${totalLength} Templates`);
            count++;
        }
        console.log(`✅ Seeded ${templates.length} Templates`);
    } catch (error) {
        console.error('❌ Error during seeding:', error);
        throw error;
    }
}

seedTemplates()
    .catch((error) => {
        console.error('💥 Seed failed:', error);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
