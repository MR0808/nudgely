import {
    Body,
    Button,
    Column,
    Container,
    Head,
    Heading,
    Html,
    Img,
    Link,
    Preview,
    pixelBasedPreset,
    Row,
    Section,
    Tailwind,
    Text
} from '@react-email/components';
import type * as React from 'react';

interface UpgradeEmailTemplateProps {
    name?: string;
    plan?: string;
}

const baseUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : 'http://localhost:3000';

export const UpgradeEmailTemplate = ({
    name,
    plan
}: UpgradeEmailTemplateProps) => {
    return (
        <Html>
            <Head />
            <Tailwind
                config={{
                    presets: [pixelBasedPreset],
                    theme: {
                        extend: {
                            colors: {
                                brand: '#2250f4',
                                offwhite: '#fafbfb'
                            },
                            spacing: {
                                0: '0px',
                                20: '20px',
                                45: '45px'
                            }
                        }
                    }
                }}
            >
                <Preview>Thank you for upgrading!</Preview>
                <Body className="bg-offwhite font-sans text-base">
                    <Img
                        src={`${baseUrl}/images/logo/logo.png`}
                        width="200"
                        height="100"
                        alt="Nudgely"
                        className="mx-auto my-20"
                    />
                    <Container className="bg-white p-45">
                        <Heading className="my-0 text-center leading-8">
                            Welcome to Your New Plan
                        </Heading>

                        <Section>
                            <Row>
                                <Text className="text-base">Hi {name},</Text>
                                <Text className="text-base">
                                    Great news—your subscription has been
                                    upgraded to the{' '}
                                    <span className="font-bold">{plan}</span>{' '}
                                    plan! 🎉
                                </Text>
                            </Row>
                        </Section>
                        <Section>
                            <Row>
                                <Text className="text-base">
                                    Here&apos;s what you can look forward to:
                                </Text>
                            </Row>
                        </Section>

                        <ul>
                            <li className="mb-2">
                                More users, teams, and tasks
                            </li>
                            <li className="mb-2">
                                Enhanced features to help you stay organized
                            </li>
                            <li className="mb-2">Priority support</li>
                        </ul>
                        <Section>
                            <Row>
                                <Text className="text-base">
                                    You&apos;re all set up and ready to go.
                                    Start exploring your new features from your{' '}
                                    <a href={baseUrl}>dashboard</a>.
                                </Text>
                                <Text className="text-base">
                                    Thanks for choosing Nudgely—we’re excited to
                                    grow with you!
                                </Text>
                                <Text className="text-base">
                                    Cheers
                                    <br />
                                    Mark
                                    <br />
                                    Nudgely CEO
                                </Text>
                            </Row>
                        </Section>
                    </Container>

                    <Container className="mt-20">
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
            </Tailwind>
        </Html>
    );
};

UpgradeEmailTemplate.PreviewProps = {
    name: 'Alan',
    plan: 'Growth'
} satisfies UpgradeEmailTemplateProps;

export default UpgradeEmailTemplate;

const footerText = {
    fontSize: '12px',
    color: '#b7b7b7',
    lineHeight: '15px',
    textAlign: 'left' as const,
    marginBottom: '50px'
};
