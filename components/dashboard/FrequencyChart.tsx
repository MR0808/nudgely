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
import { FrequencyChartProps } from '@/types/dashboard';
import { Pie, PieChart, Cell, ResponsiveContainer, Legend } from 'recharts';

const COLORS = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)'];

const FrequencyChart = ({ data }: FrequencyChartProps) => {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Nudges by Frequency</CardTitle>
                <CardDescription>Distribution of nudge types</CardDescription>
            </CardHeader>
            <CardContent>
                <ChartContainer
                    config={{
                        DAILY: { label: 'Daily', color: 'var(--chart-1)' },
                        WEEKLY: { label: 'Weekly', color: 'var(--chart-2)' },
                        MONTHLY: { label: 'Monthly', color: 'var(--chart-3)' }
                    }}
                    className="h-64"
                >
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={data}
                                dataKey="count"
                                nameKey="frequency"
                                cx="50%"
                                cy="50%"
                                outerRadius={80}
                                label
                            >
                                {data.map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={COLORS[index % COLORS.length]}
                                    />
                                ))}
                            </Pie>
                            <ChartTooltip content={<ChartTooltipContent />} />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </ChartContainer>
            </CardContent>
        </Card>
    );
};

export default FrequencyChart;
