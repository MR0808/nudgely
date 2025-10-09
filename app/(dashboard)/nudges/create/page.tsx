'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

export default function AddNudgePage() {
    const [loading, setLoading] = useState(false);

    // Form state to power live preview
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [frequency, setFrequency] = useState('');
    const [time, setTime] = useState('');
    const [recipient, setRecipient] = useState('');

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);

        const formData = new FormData(e.currentTarget);
        const payload = {
            title: formData.get('title'),
            description: formData.get('description'),
            frequency: formData.get('frequency'),
            time: formData.get('time'),
            recipients: formData.get('recipients')
        };

        await fetch('/actions/create-nudge', {
            method: 'POST',
            body: JSON.stringify(payload)
        });

        toast.success('Nudge created successfully ✅');
        setLoading(false);
    }

    return (
        <div className="container mx-auto max-w-5xl py-10 grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left Column: Form */}
            <Card>
                <CardHeader>
                    <CardTitle>Create a New Nudge</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <Label htmlFor="title">Title *</Label>
                            <Input
                                id="title"
                                name="title"
                                placeholder="e.g. Send weekly client report"
                                required
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                            />
                        </div>

                        <div>
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                name="description"
                                placeholder="Optional details…"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                            />
                        </div>

                        <div>
                            <Label>Frequency *</Label>
                            <Select
                                name="frequency"
                                required
                                onValueChange={(val) => setFrequency(val)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select frequency" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="daily">Daily</SelectItem>
                                    <SelectItem value="weekly">
                                        Weekly
                                    </SelectItem>
                                    <SelectItem value="monthly">
                                        Monthly
                                    </SelectItem>
                                    <SelectItem value="custom">
                                        Custom Interval
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label htmlFor="time">
                                Reminder Time (optional)
                            </Label>
                            <Input
                                id="time"
                                name="time"
                                type="time"
                                step="3600"
                                value={time}
                                onChange={(e) => setTime(e.target.value)}
                            />
                        </div>

                        <div>
                            <Label htmlFor="recipients">Recipients *</Label>
                            <Input
                                id="recipients"
                                name="recipients"
                                placeholder="Enter email(s)"
                                required
                                value={recipient}
                                onChange={(e) => setRecipient(e.target.value)}
                            />
                        </div>

                        <Button type="submit" disabled={loading}>
                            {loading ? 'Creating...' : 'Create Nudge'}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {/* Right Column: Live Preview */}
            <Card className="bg-gray-50">
                <CardHeader>
                    <CardTitle>Email Preview</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="border rounded-lg bg-white shadow-sm p-6 space-y-4">
                        {/* Branding */}
                        <div className="border-b pb-3">
                            <h2 className="text-xl font-bold text-indigo-600">
                                Nudgely
                            </h2>
                            <p className="text-sm text-gray-500">
                                Your simple recurring task reminders
                            </p>
                        </div>

                        {/* Content */}
                        <div className="space-y-2">
                            <h3 className="text-lg font-semibold">
                                {title || 'Your Nudge Title'}
                            </h3>
                            <p className="text-gray-700">
                                {description ||
                                    'This is where your task details will appear.'}
                            </p>
                            <p className="text-sm text-gray-500">
                                Frequency: {frequency || 'Not set'} <br />
                                Time: {time || '8:00 AM'} <br />
                                Recipient: {recipient || 'someone@example.com'}
                            </p>
                        </div>

                        {/* CTA */}
                        <div className="pt-4">
                            <Button
                                disabled
                                className="bg-emerald-500 hover:bg-emerald-600 text-white"
                            >
                                Mark as Complete
                            </Button>
                        </div>

                        {/* Footer */}
                        <div className="border-t pt-3 text-xs text-gray-500">
                            Powered by Nudgely • Simple recurring task reminders
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
