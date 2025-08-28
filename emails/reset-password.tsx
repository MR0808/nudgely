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

interface ResetPasswordEmailTemplateProps {
    name?: string;
    link?: string;
}

const baseUrl = process.env.NEXT_PUBLIC_APP_URL
    ? process.env.NEXT_PUBLIC_APP_URL
    : 'http://localhost:3000';

export const ResetPasswordEmailTemplate = ({
    name,
    link
}: ResetPasswordEmailTemplateProps) => {
    return (
        <Html>
            <Head />
            <Body style={main}>
                <Preview>Your password reset link is available</Preview>
                <Container style={container}>
                    <Section style={logoContainer}>
                        <Img
                            src={`${baseUrl}/images/logo/logo.png`}
                            width="120"
                            height="36"
                            alt="Nudgely"
                        />
                    </Section>
                    <Heading style={h1}>Reset your password</Heading>
                    <Text style={text}>Hi {name},</Text>
                    <Text style={text}>
                        Someone recently requested a password change for your
                        Nudgely account. If this was you, you can set a new
                        password here:
                    </Text>

                    <Button style={button} href={link}>
                        Reset password
                    </Button>

                    <Text style={text}>
                        If you don&apos;t want to change your password or
                        didn&apos;t request this, just ignore and delete this
                        message.
                    </Text>

                    <Text style={text}>
                        To keep your account secure, please don&apos;t forward
                        this email to anyone.
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

ResetPasswordEmailTemplate.PreviewProps = {
    name: 'Alan',
    link: 'http://www.reset.com/'
} as ResetPasswordEmailTemplateProps;

export default ResetPasswordEmailTemplate;

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
