import {
    Body,
    Container,
    Head,
    Heading,
    Html,
    Img,
    Preview,
    Section,
    Text
} from '@react-email/components';

interface TeamAddedEmailTemplateProps {
    name?: string;
    companyName?: string;
    teamName?: string;
    role?: string;
}

const baseUrl = process.env.NEXT_PUBLIC_APP_URL
    ? process.env.NEXT_PUBLIC_APP_URL
    : 'http://localhost:3000';

export const TeamAddedEmailTemplate = ({
    name,
    companyName,
    teamName,
    role
}: TeamAddedEmailTemplateProps) => {
    return (
        <Html>
            <Head />
            <Body style={main}>
                <Preview>
                    You&apos;ve been added to {teamName || 'a new team'} on
                    Nudgely.
                </Preview>
                <Container style={container}>
                    <Section style={logoContainer}>
                        <Img
                            src={`${baseUrl}/images/logo/logo.png`}
                            width="120"
                            height="36"
                            alt="Nudgely"
                        />
                    </Section>
                    <Heading style={h1}>You&apos;re in</Heading>
                    <Text style={text}>Hi {name},</Text>
                    <Text style={text}>
                        You have been added as{' '}
                        {role === 'admin' ? 'an admin' : 'a team member'} to the{' '}
                        {teamName} team in {companyName} on Nudgely.
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

TeamAddedEmailTemplate.PreviewProps = {
    name: 'Alan',
    companyName: 'nudge Co',
    teamName: 'Tech',
    role: 'member'
} as TeamAddedEmailTemplateProps;

export default TeamAddedEmailTemplate;

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

const text = {
    color: '#000',
    fontSize: '14px',
    lineHeight: '24px'
};
