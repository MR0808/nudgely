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
import { RecentCompletionsTableProps } from '@/types/dashboard';

function formatDateTime(date: Date) {
    return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
    }).format(new Date(date));
}

const RecentCompletionsTable = ({ data }: RecentCompletionsTableProps) => {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Recent Completions</CardTitle>
                <CardDescription>Latest nudge completions</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nudge</TableHead>
                            <TableHead>Completed By</TableHead>
                            <TableHead>When</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={3}
                                    className="text-center text-muted-foreground"
                                >
                                    No completions yet
                                </TableCell>
                            </TableRow>
                        ) : (
                            data.map((completion) => (
                                <TableRow key={completion.id}>
                                    <TableCell className="font-medium">
                                        {completion.nudgeName}
                                    </TableCell>
                                    <TableCell>
                                        {completion.completedBy}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {formatDateTime(completion.completedAt)}
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

export default RecentCompletionsTable;
