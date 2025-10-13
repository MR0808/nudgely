'use client';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';

interface HourSelectorProps {
    value: number;
    onChange: (value: number) => void;
    label?: string;
    className?: string;
}

export function HourSelector({
    value,
    onChange,
    label = 'Select hour',
    className
}: HourSelectorProps) {
    const formatHour = (hour: number) => {
        const period = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
        return { displayHour, period };
    };

    const getTimeOfDay = (hour: number) => {
        if (hour >= 5 && hour < 12) return 'Morning';
        if (hour >= 12 && hour < 17) return 'Afternoon';
        if (hour >= 17 && hour < 21) return 'Evening';
        return 'Night';
    };

    const { displayHour, period } = formatHour(value);

    return (
        <div className={cn('space-y-6', className)}>
            <div className="space-y-2">
                <div className="flex items-baseline justify-between">
                    <Label className="text-sm font-medium text-foreground">
                        {label}
                    </Label>
                    <span className="text-xs text-muted-foreground">
                        {getTimeOfDay(value)}
                    </span>
                </div>
            </div>

            <div className="space-y-8">
                <div className="flex items-center justify-center gap-3">
                    <div className="relative">
                        <div className="text-5xl font-light tracking-tight text-foreground tabular-nums">
                            {displayHour.toString().padStart(2, '0')}:00
                        </div>
                        <div className="absolute -bottom-6 left-0 right-0 text-center text-sm text-muted-foreground">
                            {value === 0
                                ? 'Midnight'
                                : value === 12
                                  ? 'Noon'
                                  : ''}
                        </div>
                    </div>
                    <div className="flex flex-col gap-1 self-start pt-2">
                        <span className="text-2xl font-medium text-foreground">
                            {period}
                        </span>
                    </div>
                </div>

                {/* Slider control */}
                <div className="space-y-4 px-2">
                    <Slider
                        value={[value]}
                        onValueChange={(values) => onChange(values[0])}
                        min={0}
                        max={23}
                        step={1}
                        className="w-full"
                    />

                    <div className="flex justify-between text-xs text-muted-foreground tabular-nums">
                        <span>12 AM</span>
                        <span>6 AM</span>
                        <span>12 PM</span>
                        <span>6 PM</span>
                        <span>11 PM</span>
                    </div>
                </div>

                <div className="grid grid-cols-4 gap-2">
                    {[
                        { hour: 0, label: '12 AM' },
                        { hour: 6, label: '6 AM' },
                        { hour: 12, label: '12 PM' },
                        { hour: 18, label: '6 PM' }
                    ].map(({ hour, label }) => (
                        <button
                            key={hour}
                            type="button"
                            onClick={() => onChange(hour)}
                            className={cn(
                                'rounded-md border px-3 py-2 text-sm font-medium transition-colors',
                                'hover:bg-accent hover:text-accent-foreground',
                                value === hour
                                    ? 'border-primary bg-primary text-primary-foreground'
                                    : 'border-border bg-card text-card-foreground'
                            )}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
