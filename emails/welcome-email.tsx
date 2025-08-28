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

interface WelcomeEmailTemplateProps {
    name: string;
}

const baseUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : 'http://localhost:3000';

const steps = [
    {
        id: 1,
        Description: (
            <li className="mb-2" key={1}>
                1️⃣{' '}
                <span className="font-bold">
                    Create your first recurring task
                </span>{' '}
                (think payroll, reports, or even watering the office plant 🌱)
            </li>
        )
    },
    {
        id: 2,
        Description: (
            <li className="mb-2" key={2}>
                2️⃣{' '}
                <span className="font-bold">Choose how often it repeats</span> —
                daily, weekly, monthly, or custom
            </li>
        )
    },
    {
        id: 3,
        Description: (
            <li className="mb-2" key={3}>
                3️⃣{' '}
                <span className="font-bold">
                    Let Nudgely handle the reminders
                </span>{' '}
                so you can focus on what actually matters
            </li>
        )
    }
];

const tasks = [
    {
        id: 1,
        Description: (
            <li className="mb-2" key={1}>
                💰 Send payroll every fortnight
            </li>
        )
    },
    {
        id: 2,
        Description: (
            <li className="mb-2" key={2}>
                🧾 Invoice clients at the end of the month
            </li>
        )
    },
    {
        id: 3,
        Description: (
            <li className="mb-2" key={3}>
                📊 Run weekly sales reports
            </li>
        )
    },
    {
        id: 4,
        Description: (
            <li className="mb-2" key={4}>
                🛡️ Check compliance deadlines
            </li>
        )
    },
    {
        id: 5,
        Description: (
            <li className="mb-2" key={5}>
                🎂 Don’t forget office birthdays 🎉
            </li>
        )
    }
];
export const WelcomeEmailTemplate = ({ name }: WelcomeEmailTemplateProps) => {
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
                <Preview>
                    Keep your team on track with effortless recurring reminders.
                </Preview>
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
                            Welcome to Nudgely
                        </Heading>

                        <Section>
                            <Row>
                                <Text className="text-base">Hi {name},</Text>
                                <Text className="text-base">
                                    Welcome to{' '}
                                    <span className="font-bold">Nudgely</span> —
                                    we&apos;re really excited to have you here!
                                    🎉
                                </Text>
                                <Text className="text-base">
                                    Nudgely is built for people like you who
                                    <span className="font-bold">
                                        want to stay on top of recurring tasks
                                        without the chaos
                                    </span>
                                    . No more sticky notes, no more forgotten
                                    deadlines, and definitely no more
                                    last-minute scrambles.
                                </Text>
                                <Text className="text-base">
                                    Here&apos;s what you can do in the next 60
                                    seconds to get your first win:
                                </Text>
                            </Row>
                        </Section>

                        <ul className="list-none">
                            {steps?.map(({ Description }) => Description)}
                        </ul>

                        <Section className="text-center mt-10">
                            <Button
                                className="rounded-lg bg-brand px-[18px] py-3 text-white"
                                href={`${baseUrl}/`}
                            >
                                Set up my first task
                            </Button>
                        </Section>
                        <Section>
                            <Row>
                                <Text className="text-base">
                                    Need some inspiration? Here are a few
                                    popular Nudgely tasks:
                                </Text>
                            </Row>
                        </Section>

                        <ul>{tasks?.map(({ Description }) => Description)}</ul>
                        <Section>
                            <Row>
                                <Text className="text-base">
                                    ✨{' '}
                                    <span className="font-bold">Pro tip:</span>{' '}
                                    The sooner you add 2-3 recurring tasks, the
                                    more you&apos;ll see how effortless Nudgely
                                    makes it to stay consistent.
                                </Text>
                                <Text className="text-base">
                                    We&apos;re here to support you every step of
                                    the way — and if you ever get stuck, just
                                    hit reply. A real human will help you out.
                                </Text>
                                <Text className="text-base">
                                    Welcome aboard, {name} — you&apos;ve just
                                    taken the first step towards{' '}
                                    <span className="font-bold">
                                        never forgetting the important stuff
                                        again
                                    </span>
                                    .
                                </Text>
                                <Text className="text-base">
                                    Cheers
                                    <br />
                                    Mark
                                    <br />
                                    Nudgely CEO
                                </Text>
                                <Text className="text-base">
                                    P.S. You&apos;re on the{' '}
                                    <span className="font-bold">
                                        Free Forever plan,
                                    </span>{' '}
                                    which gives you a taste of Nudgely with
                                    limited features. It&apos;s perfect to get
                                    started — and whenever you&apos;re ready to
                                    unlock advanced features, more reminders,
                                    and full customisation, upgrading is just a
                                    click away.
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

WelcomeEmailTemplate.PreviewProps = {
    name: 'Alan'
} satisfies WelcomeEmailTemplateProps;

export default WelcomeEmailTemplate;

const footerText = {
    fontSize: '12px',
    color: '#b7b7b7',
    lineHeight: '15px',
    textAlign: 'left' as const,
    marginBottom: '50px'
};
