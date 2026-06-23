import {
    Body,
    Container,
    Head,
    Html,
    Img,
    Preview,
    Section,
    Text
} from '@react-email/components';

interface PaymentFailedEmailTemplateProps {
    name?: string;
}

const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

export const PaymentFailedEmailTemplate = ({
    name
}: PaymentFailedEmailTemplateProps) => (
    <Html>
        <Head />
        <Body style={main}>
            <Preview>Action required: your Nudgely payment failed</Preview>
            <Container style={container}>
                <Section style={logoContainer}>
                    <Img
                        src={`${baseUrl}/images/logo/logo.png`}
                        width="120"
                        height="36"
                        alt="Nudgely"
                    />
                </Section>
                <Text style={text}>Hi {name ?? 'there'},</Text>
                <Text style={text}>
                    We couldn&apos;t process your latest subscription payment.
                    Please update your payment method to keep your Nudgely plan
                    active.
                </Text>
                <Text style={text}>
                    Stripe will retry the charge automatically. You can update
                    your card anytime from billing:
                </Text>
                <Text style={text}>
                    <a href={`${baseUrl}/billing`}>Manage billing</a>
                </Text>
                <Text style={text}>
                    If you need help, reply to this email or contact{' '}
                    {process.env.NEXT_PUBLIC_APP_EMAIL_SUPPORT ??
                        'support@nudgelyapp.com'}
                    .
                </Text>
            </Container>
        </Body>
    </Html>
);

const main = {
    backgroundColor: '#f6f9fc',
    fontFamily:
        '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif'
};

const container = {
    backgroundColor: '#ffffff',
    margin: '0 auto',
    padding: '20px 0 48px',
    marginBottom: '64px'
};

const logoContainer = { padding: '20px 30px' };

const text = {
    color: '#333',
    fontSize: '16px',
    lineHeight: '26px',
    padding: '0 30px'
};

export default PaymentFailedEmailTemplate;
