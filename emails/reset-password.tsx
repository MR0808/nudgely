import {
    Body,
    Button,
    Container,
    Head,
    Html,
    Img,
    Link,
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

console.log(baseUrl);

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
                    <Img
                        src={`${baseUrl}/images/logo/logo.png`}
                        width="100"
                        height="33"
                        alt="Nudgely"
                    />
                    <Section>
                        <Text style={text}>Hi {name},</Text>
                        <Text style={text}>
                            Someone recently requested a password change for
                            your Buxmate account. If this was you, you can set a
                            new password here:
                        </Text>
                        <Button style={button} href={link}>
                            Reset password
                        </Button>
                        <Text style={text}>
                            If you don&apos;t want to change your password or
                            didn&apos;t request this, just ignore and delete
                            this message.
                        </Text>
                        <Text style={text}>
                            To keep your account secure, please don&apos;t
                            forward this email to anyone. See our Help Center
                            for more security tips.
                        </Text>
                    </Section>
                </Container>
            </Body>
        </Html>
    );
};

ResetPasswordEmailTemplate.PreviewProps = {
    userFirstname: 'Alan',
    resetPasswordLink: 'https://www.buxmate.com'
} as ResetPasswordEmailTemplateProps;

export default ResetPasswordEmailTemplate;

const main = {
    backgroundColor: '#f6f9fc',
    padding: '10px 0'
};

const container = {
    backgroundColor: '#ffffff',
    border: '1px solid #f0f0f0',
    padding: '45px'
};

const text = {
    fontSize: '16px',
    fontFamily:
        "'Open Sans', 'HelveticaNeue-Light', 'Helvetica Neue Light', 'Helvetica Neue', Helvetica, Arial, 'Lucida Grande', sans-serif",
    fontWeight: '300',
    color: '#404040',
    lineHeight: '26px'
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

const anchor = {
    textDecoration: 'underline'
};
