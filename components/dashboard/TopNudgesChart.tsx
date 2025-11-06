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
import { TopNudgesChartProps } from '@/types/dashboard';
import {
    Bar,
    BarChart,
    XAxis,
    YAxis,
    CartesianGrid,
    ResponsiveContainer,
    Cell
} from 'recharts';

const NUDGE_COLORS = [
    'var(--chart-1)',
    'var(--chart-2)',
    'var(--chart-3)',
    'var(--chart-4)',
    'var(--chart-5)'
];

const TopNudgesChart = ({ data }: TopNudgesChartProps) => {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Top Performing Nudges</CardTitle>
                <CardDescription>Highest completion rates</CardDescription>
            </CardHeader>
            <CardContent>
                <ChartContainer
                    config={{
                        completionRate: {
                            label: 'Completion Rate (%)',
                            color: 'var(--chart-4)'
                        }
                    }}
                    className="h-80"
                >
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis type="number" domain={[0, 100]} />
                            <YAxis
                                dataKey="nudgeName"
                                type="category"
                                width={150}
                            />
                            <ChartTooltip content={<ChartTooltipContent />} />
                            <Bar dataKey="completionRate" radius={[0, 4, 4, 0]}>
                                {data.map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={
                                            NUDGE_COLORS[
                                                index % NUDGE_COLORS.length
                                            ]
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

export default TopNudgesChart;
