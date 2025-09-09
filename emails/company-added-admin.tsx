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

interface CompanyAddedAdminEmailTemplateProps {
    name?: string;
    companyName?: string;
}

const baseUrl = process.env.NEXT_PUBLIC_APP_URL
    ? process.env.NEXT_PUBLIC_APP_URL
    : 'http://localhost:3000';

export const CompanyAddedAdminEmailTemplate = ({
    name,
    companyName
}: CompanyAddedAdminEmailTemplateProps) => {
    return (
        <Html>
            <Head />
            <Body style={main}>
                <Preview>You are now an admin.</Preview>
                <Container style={container}>
                    <Section style={logoContainer}>
                        <Img
                            src={`${baseUrl}/images/logo/logo.png`}
                            width="120"
                            height="36"
                            alt="Nudgely"
                        />
                    </Section>
                    <Heading style={h1}>New Admin</Heading>
                    <Text style={text}>Hi {name},</Text>
                    <Text style={text}>
                        You have been added as an admin to {companyName}.
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

CompanyAddedAdminEmailTemplate.PreviewProps = {
    name: 'Alan',
    companyName: 'nudge Co'
} as CompanyAddedAdminEmailTemplateProps;

export default CompanyAddedAdminEmailTemplate;

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
