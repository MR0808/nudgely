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
import { ActiveRecipientsTableProps } from '@/types/dashboard';

const ActiveRecipientsTable = ({ data }: ActiveRecipientsTableProps) => {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Most Active Recipients</CardTitle>
                <CardDescription>
                    Top performers by completion rate
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Recipient</TableHead>
                            <TableHead className="text-right">
                                Completions
                            </TableHead>
                            <TableHead className="text-right">Rate</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={3}
                                    className="text-center text-muted-foreground"
                                >
                                    No data available
                                </TableCell>
                            </TableRow>
                        ) : (
                            data.map((recipient) => (
                                <TableRow key={recipient.email}>
                                    <TableCell>
                                        <div>
                                            <div className="font-medium">
                                                {recipient.name}
                                            </div>
                                            <div className="text-sm text-muted-foreground">
                                                {recipient.email}
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {recipient.completions}/
                                        {recipient.totalSent}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Badge
                                            variant={
                                                recipient.completionRate >= 80
                                                    ? 'default'
                                                    : recipient.completionRate >=
                                                        50
                                                      ? 'secondary'
                                                      : 'destructive'
                                            }
                                        >
                                            {recipient.completionRate}%
                                        </Badge>
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

export default ActiveRecipientsTable;
