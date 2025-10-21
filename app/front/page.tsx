'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Check } from 'lucide-react';

export default function LandingPage() {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState<
        'idle' | 'loading' | 'success' | 'error'
    >('idle');

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setStatus('loading');
        try {
            // await subscribe(email);
            setStatus('success');
            setEmail('');
        } catch {
            setStatus('error');
        }
    }

    return (
        <main className="min-h-screen flex flex-col bg-gradient-to-b from-slate-50 to-white text-slate-900">
            {/* Hero Section */}{' '}
            <section className="text-center py-20 px-6">
                {' '}
                <h1 className="text-4xl md:text-6xl font-bold mb-4">
                    Never chase a task again.{' '}
                </h1>{' '}
                <p className="text-lg md:text-xl max-w-2xl mx-auto mb-8 text-slate-600">
                    Nudgely automates team reminders and follow-ups — so nothing
                    slips through the cracks. Join early access for free.{' '}
                </p>
                ```
                <form
                    onSubmit={handleSubmit}
                    className="flex justify-center gap-2 max-w-md mx-auto"
                >
                    <Input
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                    <Button type="submit" disabled={status === 'loading'}>
                        {status === 'loading' ? 'Joining...' : 'Join Waitlist'}
                    </Button>
                </form>
                {status === 'success' && (
                    <p className="text-green-600 mt-3">
                        You&apos;re on the list! 🎉
                    </p>
                )}
                {status === 'error' && (
                    <p className="text-red-600 mt-3">
                        Something went wrong. Try again.
                    </p>
                )}
            </section>
            {/* How It Works */}
            <section className="py-16 bg-slate-100">
                <h2 className="text-3xl font-semibold text-center mb-8">
                    How Nudgely Works
                </h2>
                <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto px-6">
                    {[
                        {
                            title: 'Create Nudges',
                            desc: 'Set up recurring reminders for tasks and assign them to yourself or your team.'
                        },
                        {
                            title: 'Automate Follow-ups',
                            desc: 'Nudgely sends polite, timed reminders via email to keep everyone on track.'
                        },
                        {
                            title: 'Track Completions',
                            desc: 'Stay informed as tasks get completed — no micromanaging required.'
                        }
                    ].map((step) => (
                        <Card
                            key={step.title}
                            className="border-none shadow-md text-center"
                        >
                            <CardContent className="p-6">
                                <Check className="mx-auto text-emerald-500 w-10 h-10 mb-3" />
                                <h3 className="font-semibold text-xl mb-2">
                                    {step.title}
                                </h3>
                                <p className="text-slate-600">{step.desc}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </section>
            {/* Features Section */}
            <section className="py-20 px-6 max-w-6xl mx-auto text-center">
                <h2 className="text-3xl font-semibold mb-8">
                    Why Teams Love Nudgely
                </h2>
                <div className="grid md:grid-cols-3 gap-8 text-left">
                    {[
                        {
                            title: 'Simple & Fast',
                            desc: 'Create a nudge in seconds — no bloated project management required.'
                        },
                        {
                            title: 'Timezone Aware',
                            desc: 'Reminders are sent at the right time, wherever your team is.'
                        },
                        {
                            title: 'One-Click Completion',
                            desc: 'Tasks can be marked complete right from the email — no logins needed.'
                        }
                    ].map((f) => (
                        <Card
                            key={f.title}
                            className="shadow-sm border-slate-200"
                        >
                            <CardContent className="p-6">
                                <h3 className="font-semibold text-lg mb-2">
                                    {f.title}
                                </h3>
                                <p className="text-slate-600">{f.desc}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </section>
            {/* CTA Repeat */}
            <section className="py-16 text-center bg-slate-50">
                <h2 className="text-3xl font-semibold mb-4">
                    Be the first to try Nudgely
                </h2>
                <p className="text-slate-600 mb-6">
                    Join the waitlist today — it&apos;s free forever for early
                    users.
                </p>
                <form
                    onSubmit={handleSubmit}
                    className="flex justify-center gap-2 max-w-md mx-auto"
                >
                    <Input
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                    <Button type="submit" disabled={status === 'loading'}>
                        {status === 'loading' ? 'Joining...' : 'Join Waitlist'}
                    </Button>
                </form>
            </section>
            {/* Footer */}
            <footer className="py-6 text-center text-slate-500 text-sm">
                © {new Date().getFullYear()} Nudgely. All rights reserved.
            </footer>
        </main>
    );
}
