import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AlertCircle } from 'lucide-react';
import { NudgesNeedingAttentionProps } from '@/types/dashboard';

const NudgesNeedingAttention = ({ data }: NudgesNeedingAttentionProps) => {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-destructive" />
                    Nudges Needing Attention
                </CardTitle>
                <CardDescription>
                    Low completion rates or overdue instances
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nudge</TableHead>
                            <TableHead className="text-right">
                                Completion Rate
                            </TableHead>
                            <TableHead className="text-right">
                                Overdue
                            </TableHead>
                            <TableHead>Last Instance</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={4}
                                    className="text-center text-muted-foreground"
                                >
                                    All nudges performing well!
                                </TableCell>
                            </TableRow>
                        ) : (
                            data.map((nudge) => (
                                <TableRow key={nudge.nudgeId}>
                                    <TableCell className="font-medium">
                                        {nudge.nudgeName}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Badge
                                            variant={
                                                nudge.completionRate < 30
                                                    ? 'destructive'
                                                    : 'secondary'
                                            }
                                        >
                                            {nudge.completionRate}%
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {nudge.overdueCount > 0 && (
                                            <Badge variant="destructive">
                                                {nudge.overdueCount}
                                            </Badge>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {nudge.lastInstanceDate
                                            ? new Date(
                                                  nudge.lastInstanceDate
                                              ).toLocaleDateString()
                                            : 'Never'}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
};

export default NudgesNeedingAttention;
