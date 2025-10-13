'use client';

import { Button } from '@/components/ui/button';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useNudgeCreateStore } from '@/stores/nudgeCreateStore';

const NudgePreview = () => {
    const {
        title,
        setTitle,
        description,
        setDescription,
        frequency,
        setFrequency,
        time,
        setTime,
        recipient,
        setRecipient
    } = useNudgeCreateStore();
    return (
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
    );
};
export default NudgePreview;
