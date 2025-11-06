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
import { CompletionsChartProps } from '@/types/dashboard';
import {
    Line,
    LineChart,
    XAxis,
    YAxis,
    CartesianGrid,
    ResponsiveContainer
} from 'recharts';

const CompletionsChart = ({ data }: CompletionsChartProps) => {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Completions Over Time</CardTitle>
                <CardDescription>Last 30 days</CardDescription>
            </CardHeader>
            <CardContent>
                <ChartContainer
                    config={{
                        count: {
                            label: 'Completions',
                            color: 'var(--chart-1)'
                        }
                    }}
                    className="h-64"
                >
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis
                                dataKey="date"
                                tickFormatter={(value) =>
                                    new Date(value).toLocaleDateString(
                                        'en-US',
                                        { month: 'short', day: 'numeric' }
                                    )
                                }
                            />
                            <YAxis />
                            <ChartTooltip content={<ChartTooltipContent />} />
                            <Line
                                type="monotone"
                                dataKey="count"
                                stroke="var(--color-count)"
                                strokeWidth={2}
                                dot={{ fill: 'var(--color-count)' }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </ChartContainer>
            </CardContent>
        </Card>
    );
};

export default CompletionsChart;
