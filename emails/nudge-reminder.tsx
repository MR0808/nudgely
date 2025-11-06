import {
    Body,
    Column,
    Container,
    Head,
    Heading,
    Html,
    Img,
    Button,
    Preview,
    Section,
    Text
} from '@react-email/components';

interface NudgeReminderTemplateProps {
    name?: string;
    nudgeName?: string;
    nudgeDescription?: string;
    completionUrl?: string;
    scheduleInfo?: string;
}

const baseUrl = process.env.NEXT_PUBLIC_APP_URL
    ? process.env.NEXT_PUBLIC_APP_URL
    : 'http://localhost:3000';

export const NudgeReminderTemplate = ({
    name,
    nudgeName = 'Your task',
    nudgeDescription,
    completionUrl,
    scheduleInfo
}: NudgeReminderTemplateProps) => {
    return (
        <Html>
            <Head />
            <Body style={main}>
                <Preview>Reminder: {nudgeName}</Preview>
                <Container style={container}>
                    <Section style={logoContainer}>
                        <Img
                            src={`${baseUrl}/images/logo/logo.png`}
                            width="120"
                            height="36"
                            alt="Nudgely"
                        />
                    </Section>
                    <Heading style={h1}>Nudge Reminder</Heading>
                    <Text style={text}>Hi {name},</Text>
                    <Text style={text}>This is your reminder for:</Text>

                    <Heading style={nudgeTitle}>{nudgeName}</Heading>

                    {nudgeDescription && (
                        <Text style={description}>{nudgeDescription}</Text>
                    )}

                    {scheduleInfo && (
                        <Section style={scheduleBox}>
                            <Text style={scheduleLabel}>📅 Schedule</Text>
                            <Text style={scheduleText}>{scheduleInfo}</Text>
                        </Section>
                    )}

                    <Button style={button} href={completionUrl}>
                        Complete Nudge
                    </Button>

                    <Text style={text}>
                        If you didn't expect this reminder, you can safely
                        ignore this email.
                    </Text>

                    <Text style={text}>Cheers</Text>

                    <Text style={text}>The Nudgely Team</Text>

                    <Section>
                        <Text style={footerText}>
                            © 2025 Nudgely
                            <br />
                            <br />
                            All rights reserved.
                        </Text>
                    </Section>
                </Container>
            </Body>
        </Html>
    );
};

NudgeReminderTemplate.PreviewProps = {
    name: 'Alan',
    nudgeName: 'Your task',
    nudgeDescription: 'This is a description',
    completionUrl: 'https://www.google.com/'
} as NudgeReminderTemplateProps;

export default NudgeReminderTemplate;

const footerText = {
    fontSize: '12px',
    color: '#b7b7b7',
    lineHeight: '15px',
    textAlign: 'left' as const,
    marginBottom: '50px'
};

const main = {
    backgroundColor: '#ffffff',
    margin: '0 auto',
    fontFamily:
        "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif"
};

const container = {
    margin: '0 auto',
    padding: '0px 20px'
};

const logoContainer = {
    marginTop: '32px'
};

const h1 = {
    color: '#1d1c1d',
    fontSize: '36px',
    fontWeight: '700',
    margin: '30px 0',
    padding: '0',
    lineHeight: '42px'
};

const nudgeTitle = {
    color: '#667eea',
    fontSize: '24px',
    fontWeight: '600',
    margin: '20px 0'
};

const description = {
    fontSize: '16px',
    lineHeight: '24px',
    margin: '16px 0',
    color: '#6b7280'
};

const text = {
    color: '#000',
    fontSize: '14px',
    lineHeight: '24px'
};

const button = {
    backgroundColor: '#007ee6',
    borderRadius: '4px',
    color: '#fff',
    fontFamily: "'Open Sans', 'Helvetica Neue', Arial",
    fontSize: '15px',
    textDecoration: 'none',
    textAlign: 'center' as const,
    display: 'block',
    width: '210px',
    padding: '14px 7px'
};

const scheduleBox = {
    backgroundColor: '#f3f4f6',
    borderLeft: '4px solid #667eea',
    padding: '16px 20px',
    margin: '24px 0',
    borderRadius: '6px'
};

const scheduleLabel = {
    fontSize: '14px',
    fontWeight: '600' as const,
    color: '#667eea',
    margin: '0 0 8px',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px'
};

const scheduleText = {
    fontSize: '16px',
    lineHeight: '24px',
    color: '#374151',
    margin: '0',
    fontWeight: '500' as const
};
