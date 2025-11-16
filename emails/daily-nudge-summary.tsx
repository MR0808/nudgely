import {
    Body,
    Container,
    Head,
    Heading,
    Html,
    Preview,
    Section,
    Text,
    Hr,
    Row,
    Column
} from '@react-email/components';

interface TeamStats {
    teamName: string;
    companyName: string;
    nudgesSent: number;
    emailsSent: number;
    emailsFailed: number;
    completions: number;
}

interface DailySummaryEmailProps {
    date: string;
    totalNudgesSent: number;
    totalEmailsSent: number;
    totalEmailsFailed: number;
    totalCompletions: number;
    totalActiveNudges: number;
    totalFinishedNudges: number;
    teamStats: TeamStats[];
}

export default function DailyNudgeSummaryEmail({
    date = 'January 1, 2025',
    totalNudgesSent = 0,
    totalEmailsSent = 0,
    totalEmailsFailed = 0,
    totalCompletions = 0,
    totalActiveNudges = 0,
    totalFinishedNudges = 0,
    teamStats = []
}: DailySummaryEmailProps) {
    const successRate =
        totalEmailsSent > 0
            ? (
                  (totalEmailsSent / (totalEmailsSent + totalEmailsFailed)) *
                  100
              ).toFixed(1)
            : '0';

    return (
        <Html>
            <Head />
            <Preview>Daily Nudge Summary - {date}</Preview>
            <Body style={main}>
                <Container style={container}>
                    {/* Header */}
                    <Section style={header}>
                        <Heading style={h1}>Daily Nudge Summary</Heading>
                        <Text style={dateText}>{date}</Text>
                    </Section>

                    {/* Overall Stats */}
                    <Section style={statsSection}>
                        <Heading style={h2}>Company-Wide Statistics</Heading>

                        <div style={statsGrid}>
                            <div style={statCard}>
                                <Text style={statLabel}>Nudges Processed</Text>
                                <Text style={statValue}>{totalNudgesSent}</Text>
                            </div>
                            <div style={statCard}>
                                <Text style={statLabel}>Emails Sent</Text>
                                <Text style={statValue}>{totalEmailsSent}</Text>
                            </div>
                            <div style={statCard}>
                                <Text style={statLabel}>Success Rate</Text>
                                <Text style={statValue}>{successRate}%</Text>
                            </div>
                            <div style={statCard}>
                                <Text style={statLabel}>Completions Today</Text>
                                <Text style={statValue}>
                                    {totalCompletions}
                                </Text>
                            </div>
                        </div>

                        <Hr style={hr} />

                        <div style={infoRow}>
                            <div>
                                <Text style={infoLabel}>Active Nudges</Text>
                                <Text style={infoValue}>
                                    {totalActiveNudges}
                                </Text>
                            </div>
                            <div>
                                <Text style={infoLabel}>Finished Today</Text>
                                <Text style={infoValue}>
                                    {totalFinishedNudges}
                                </Text>
                            </div>
                            <div>
                                <Text style={infoLabel}>Failed Emails</Text>
                                <Text style={infoValue}>
                                    {totalEmailsFailed}
                                </Text>
                            </div>
                        </div>
                    </Section>

                    {/* Team Breakdown */}
                    {teamStats.length > 0 && (
                        <Section style={teamSection}>
                            <Heading style={h2}>Team Breakdown</Heading>

                            {teamStats.map((team, index) => (
                                <div key={index} style={teamCard}>
                                    <Text style={companyName}>
                                        {team.companyName}
                                    </Text>
                                    <Text style={teamName}>
                                        {team.teamName}
                                    </Text>
                                    <div style={teamStatsRow}>
                                        <div style={teamStat}>
                                            <Text style={teamStatLabel}>
                                                Nudges
                                            </Text>
                                            <Text style={teamStatValue}>
                                                {team.nudgesSent}
                                            </Text>
                                        </div>
                                        <div style={teamStat}>
                                            <Text style={teamStatLabel}>
                                                Sent
                                            </Text>
                                            <Text style={teamStatValue}>
                                                {team.emailsSent}
                                            </Text>
                                        </div>
                                        <div style={teamStat}>
                                            <Text style={teamStatLabel}>
                                                Failed
                                            </Text>
                                            <Text style={teamStatValue}>
                                                {team.emailsFailed}
                                            </Text>
                                        </div>
                                        <div style={teamStat}>
                                            <Text style={teamStatLabel}>
                                                Completed
                                            </Text>
                                            <Text style={teamStatValue}>
                                                {team.completions}
                                            </Text>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </Section>
                    )}

                    {/* Footer */}
                    <Section style={footer}>
                        <Text style={footerText}>
                            This is an automated daily summary of nudge
                            activity.
                            {totalEmailsFailed > 0 && (
                                <>
                                    {' '}
                                    <strong>Note:</strong> {totalEmailsFailed}{' '}
                                    email(s) failed to send. Please check your
                                    email service logs for details.
                                </>
                            )}
                        </Text>
                    </Section>
                </Container>
            </Body>
        </Html>
    );
}

// Styles
const main = {
    backgroundColor: '#f6f9fc',
    fontFamily:
        '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif'
};

const container = {
    backgroundColor: '#ffffff',
    margin: '0 auto',
    padding: '20px 0',
    marginTop: '40px',
    marginBottom: '40px',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
};

const header = {
    padding: '32px 40px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    borderRadius: '8px 8px 0 0'
};

const h1 = {
    color: '#ffffff',
    fontSize: '28px',
    fontWeight: '700',
    margin: '0 0 8px',
    lineHeight: '1.2'
};

const dateText = {
    color: '#e0e7ff',
    fontSize: '16px',
    margin: '0'
};

const h2 = {
    color: '#1f2937',
    fontSize: '20px',
    fontWeight: '600',
    margin: '0 0 20px'
};

const statsSection = {
    padding: '32px 40px'
};

const statsGrid = {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
    marginBottom: '24px'
};

const statCard = {
    padding: '20px',
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
    border: '1px solid #e5e7eb'
};

const statLabel = {
    color: '#6b7280',
    fontSize: '14px',
    margin: '0 0 8px',
    fontWeight: '500'
};

const statValue = {
    color: '#111827',
    fontSize: '32px',
    fontWeight: '700',
    margin: '0',
    lineHeight: '1'
};

const hr = {
    borderColor: '#e5e7eb',
    margin: '24px 0'
};

const infoRow = {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '16px'
};

const infoLabel = {
    color: '#6b7280',
    fontSize: '13px',
    margin: '0 0 4px',
    fontWeight: '500'
};

const infoValue = {
    color: '#111827',
    fontSize: '18px',
    fontWeight: '600',
    margin: '0'
};

const teamSection = {
    padding: '0 40px 32px'
};

const teamCard = {
    padding: '20px',
    backgroundColor: '#fefce8',
    borderRadius: '8px',
    border: '1px solid #fde047',
    marginBottom: '12px'
};

const companyName = {
    color: '#6b7280',
    fontSize: '13px',
    fontWeight: '500',
    margin: '0 0 4px',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px'
};

const teamName = {
    color: '#111827',
    fontSize: '16px',
    fontWeight: '600',
    margin: '0 0 16px'
};

const teamStatsRow = {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '12px'
};

const teamStat = {
    flex: 1
};

const teamStatLabel = {
    color: '#6b7280',
    fontSize: '12px',
    margin: '0 0 4px'
};

const teamStatValue = {
    color: '#111827',
    fontSize: '20px',
    fontWeight: '600',
    margin: '0'
};

const footer = {
    padding: '0 40px 32px'
};

const footerText = {
    color: '#6b7280',
    fontSize: '13px',
    lineHeight: '1.6',
    margin: '0'
};
