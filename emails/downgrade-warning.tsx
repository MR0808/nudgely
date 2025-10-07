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
import { string } from 'zod';

interface DowngradeWarningEmailTemplateProps {
    name?: string;
    plan?: string;
}

const baseUrl = process.env.NEXT_PUBLIC_APP_URL
    ? process.env.NEXT_PUBLIC_APP_URL
    : 'http://localhost:3000';

export const DowngradeWarningEmailTemplate = ({
    name,
    plan
}: DowngradeWarningEmailTemplateProps) => {
    return (
        <Html>
            <Head />
            <Body style={main}>
                <Preview>Your company is about to be downgraded.</Preview>
                <Container style={container}>
                    <Section style={logoContainer}>
                        <Img
                            src={`${baseUrl}/images/logo/logo.png`}
                            width="120"
                            height="36"
                            alt="Nudgely"
                        />
                    </Section>
                    <Text style={text}>Hi {name},</Text>
                    <Text style={text}>
                        This is a friendly reminder that your Nudgely plan will
                        downgrade to the{' '}
                        <span className="font-bold">{plan}</span> plan tomorrow.
                    </Text>

                    <Text style={text}>
                        After tomorrow, any of your assets that are above the
                        limits for your new plan will be disabled and you will
                        need to reenable them again.
                    </Text>

                    <Text style={text}>
                        Don&apos;t want to lose access? You can upgrade again
                        anytime with just a few clicks:{' '}
                        <a href={`${baseUrl}/billing`}>Manage Your Plan</a>
                    </Text>

                    <Text style={text}>
                        Thanks for being part of Nudgely—we&apos;re here to help
                        you every step of the way.
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

DowngradeWarningEmailTemplate.PreviewProps = {
    plan: 'Free',
    name: 'Alan'
} as DowngradeWarningEmailTemplateProps;

export default DowngradeWarningEmailTemplate;

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

const heroText = {
    fontSize: '20px',
    lineHeight: '28px',
    marginBottom: '30px'
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
