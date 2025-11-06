'use client';

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from '@/components/ui/card';
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent
} from '@/components/ui/chart';
import { StatusChartProps } from '@/types/dashboard';
import {
    Bar,
    BarChart,
    XAxis,
    YAxis,
    CartesianGrid,
    ResponsiveContainer,
    Cell
} from 'recharts';

const STATUS_COLORS: Record<string, string> = {
    ACTIVE: 'var(--chart-1)',
    PAUSED: 'var(--chart-2)',
    FINISHED: 'var(--chart-3)',
    DISABLED: 'var(--chart-4)'
};

const StatusChart = ({ data }: StatusChartProps) => {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Nudges by Status</CardTitle>
                <CardDescription>Current status distribution</CardDescription>
            </CardHeader>
            <CardContent>
                <ChartContainer
                    config={{
                        ACTIVE: { label: 'Active', color: 'var(--chart-1)' },
                        PAUSED: { label: 'Paused', color: 'var(--chart-2)' },
                        FINISHED: {
                            label: 'Finished',
                            color: 'var(--chart-3)'
                        },
                        DISABLED: { label: 'Disabled', color: 'var(--chart-4)' }
                    }}
                    className="h-64"
                >
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="status" />
                            <YAxis />
                            <ChartTooltip content={<ChartTooltipContent />} />
                            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                                {data.map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={
                                            STATUS_COLORS[entry.status] ||
                                            'var(--chart-1)'
                                        }
                                    />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </ChartContainer>
            </CardContent>
        </Card>
    );
};

export default StatusChart;
