import {
    Body,
    Column,
    Container,
    Head,
    Heading,
    Html,
    Img,
    Link,
    Preview,
    Row,
    Section,
    Text
} from '@react-email/components';

interface EmailOTPEmailTemplateProps {
    name?: string;
    otp?: string;
}

const baseUrl = process.env.NEXT_PUBLIC_APP_URL
    ? process.env.NEXT_PUBLIC_APP_URL
    : 'http://localhost:3000';

export const EmailOTPEmailTemplate = ({
    name,
    otp
}: EmailOTPEmailTemplateProps) => {
    return (
        <Html>
            <Head />
            <Body style={main}>
                <Preview>Confirm your email address</Preview>
                <Container style={container}>
                    <Section style={logoContainer}>
                        <Img
                            src={`${baseUrl}/images/logo/logo.png`}
                            width="120"
                            height="36"
                            alt="Nudgely"
                        />
                    </Section>
                    <Heading style={h1}>Confirm your email address</Heading>
                    <Text style={text}>Hi {name},</Text>
                    <Text style={text}>
                        Your confirmation code is below - use it to verify your
                        email address.
                    </Text>

                    <Section style={codeBox}>
                        <Text style={confirmationCodeText}>{otp}</Text>
                    </Section>

                    <Text style={text}>
                        If you didn&apos;t request this email, there&apos;s
                        nothing to worry about, you can safely ignore it.
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

EmailOTPEmailTemplate.PreviewProps = {
    name: 'Alan',
    otp: '123456'
} as EmailOTPEmailTemplateProps;

export default EmailOTPEmailTemplate;

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

const codeBox = {
    background: 'rgb(245, 244, 245)',
    borderRadius: '4px',
    marginBottom: '30px',
    padding: '40px 10px'
};

const confirmationCodeText = {
    fontSize: '30px',
    textAlign: 'center' as const,
    verticalAlign: 'middle'
};

const text = {
    color: '#000',
    fontSize: '14px',
    lineHeight: '24px'
};
