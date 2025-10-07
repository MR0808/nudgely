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

interface DowngradeEmailTemplateProps {
    name?: string;
    plan?: string;
}

const baseUrl = process.env.NEXT_PUBLIC_APP_URL
    ? process.env.NEXT_PUBLIC_APP_URL
    : 'http://localhost:3000';

export const DowngradeEmailTemplate = ({
    name,
    plan
}: DowngradeEmailTemplateProps) => {
    return (
        <Html>
            <Head />
            <Body style={main}>
                <Preview>Your company has been downgraded.</Preview>
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
                        We wanted to let you know that your Nudgely subscription
                        has been successfully downgraded to the{' '}
                        <span className="font-bold">{plan}</span> plan.
                    </Text>

                    <Text style={text}>
                        If any of your assets are above the limits for your new
                        plan have now been disabled and you will need to
                        reenable them again.
                    </Text>

                    <Text style={text}>
                        You can manage your subscription and review your limits
                        anytime from your{' '}
                        <a href={`${baseUrl}/billing`}>billing dashboard</a>.
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

DowngradeEmailTemplate.PreviewProps = {
    plan: 'Free',
    name: 'Alan'
} as DowngradeEmailTemplateProps;

export default DowngradeEmailTemplate;

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
