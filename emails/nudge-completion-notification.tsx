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
    Text,
    Hr
} from '@react-email/components';

interface NudgeCompletionNotificationEmailProps {
    name: string;
    nudgeName: string;
    nudgeDescription?: string;
    completedBy: string;
    completedAt: string;
    comment?: string;
    isCreator?: boolean;
}

const baseUrl = process.env.NEXT_PUBLIC_APP_URL
    ? process.env.NEXT_PUBLIC_APP_URL
    : 'http://localhost:3000';

export const NudgeCompletionNotificationEmail = ({
    name,
    nudgeName,
    nudgeDescription,
    completedBy,
    completedAt,
    comment,
    isCreator = false
}: NudgeCompletionNotificationEmailProps) => {
    const previewText = `${nudgeName} has been completed by ${completedBy}`;

    return (
        <Html>
            <Head />
            <Body style={main}>
                <Preview>{previewText}</Preview>
                <Container style={container}>
                    <Section style={logoContainer}>
                        <Img
                            src={`${baseUrl}/images/logo/logo.png`}
                            width="120"
                            height="36"
                            alt="Nudgely"
                        />
                    </Section>
                    <Heading style={h1}>Nudge Completed</Heading>
                    <Text style={text}>Hi {name},</Text>
                    <Text style={text}>
                        {' '}
                        {isCreator
                            ? `Great news! Your nudge "${nudgeName}" has been completed.`
                            : `The nudge "${nudgeName}" has been marked as complete.`}
                    </Text>

                    {nudgeDescription && (
                        <Section style={descriptionBox}>
                            <Text style={descriptionLabel}>
                                Nudge Description:
                            </Text>
                            <Text style={descriptionText}>
                                {nudgeDescription}
                            </Text>
                        </Section>
                    )}

                    <Section style={detailsBox}>
                        <Text style={detailsTitle}>Completion Details</Text>

                        <Section style={detailRow}>
                            <Text style={detailLabel}>Completed by:</Text>
                            <Text style={detailValue}>{completedBy}</Text>
                        </Section>

                        <Section style={detailRow}>
                            <Text style={detailLabel}>Completed at:</Text>
                            <Text style={detailValue}>{completedAt}</Text>
                        </Section>

                        {comment && (
                            <>
                                <Hr style={divider} />
                                <Section style={commentSection}>
                                    <Text style={commentLabel}>Comment:</Text>
                                    <Text style={commentText}>{comment}</Text>
                                </Section>
                            </>
                        )}
                    </Section>

                    <Text style={disclaimerText}>
                        {isCreator
                            ? 'This notification was sent because you created this nudge.'
                            : 'This notification was sent because you are a recipient of this nudge.'}
                    </Text>

                    <Text style={footerText}>
                        © 2025 Nudgely
                        <br />
                        <br />
                        All rights reserved.
                    </Text>
                </Container>
            </Body>
        </Html>
    );
};

NudgeCompletionNotificationEmail.PreviewProps = {
    name: 'Alan',
    nudgeName: 'This is the task',
    nudgeDescription: 'This is the description',
    completedBy: 'John',
    completedAt: '1:25pm 1/09/2025',
    isCreator: false
} as NudgeCompletionNotificationEmailProps;

export default NudgeCompletionNotificationEmail;

const footerText = {
    fontSize: '12px',
    color: '#b7b7b7',
    lineHeight: '15px',
    textAlign: 'left' as const,
    marginBottom: '50px'
};

const disclaimerText = {
    fontSize: '12px',
    color: '#b7b7b7',
    lineHeight: '15px',
    textAlign: 'left' as const
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

const text = {
    color: '#000',
    fontSize: '14px',
    lineHeight: '24px'
};

const descriptionBox = {
    backgroundColor: '#f9fafb',
    borderLeft: '4px solid #667eea',
    padding: '16px',
    marginBottom: '24px',
    borderRadius: '4px'
};

const descriptionLabel = {
    fontSize: '12px',
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
    margin: '0 0 8px 0'
};

const descriptionText = {
    fontSize: '14px',
    lineHeight: '20px',
    color: '#374151',
    margin: '0'
};

const detailsBox = {
    backgroundColor: '#f0fdf4',
    border: '2px solid #86efac',
    borderRadius: '8px',
    padding: '20px',
    marginBottom: '24px'
};

const detailsTitle = {
    fontSize: '16px',
    fontWeight: '600',
    color: '#166534',
    margin: '0 0 16px 0'
};

const detailRow = {
    marginBottom: '12px'
};

const detailLabel = {
    fontSize: '13px',
    fontWeight: '600',
    color: '#15803d',
    margin: '0 0 4px 0'
};

const detailValue = {
    fontSize: '15px',
    color: '#166534',
    margin: '0'
};

const divider = {
    borderColor: '#d1fae5',
    margin: '16px 0'
};

const commentSection = {
    marginTop: '16px'
};

const commentLabel = {
    fontSize: '13px',
    fontWeight: '600',
    color: '#15803d',
    margin: '0 0 8px 0'
};

const commentText = {
    fontSize: '14px',
    lineHeight: '20px',
    color: '#166534',
    fontStyle: 'italic' as const,
    margin: '0',
    padding: '12px',
    backgroundColor: '#ffffff',
    borderRadius: '4px',
    border: '1px solid #d1fae5'
};
