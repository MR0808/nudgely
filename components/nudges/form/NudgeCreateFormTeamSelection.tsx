'use client';

import { useFormContext } from 'react-hook-form';

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from '@/components/ui/card';
import {
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage
} from '@/components/ui/form';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import type { CreateNudgeSchemaData } from '@/schemas/nudge';
import type { NudgeCreateFormBasicInformationProps } from '@/types/nudge';
import NudgeCreateFormTemplateSelect from './NudgeCreateFormTemplateSelect';

const NudgeCreateFormTeamSelection = ({
    returnTeams,
    plan
}: NudgeCreateFormBasicInformationProps) => {
    const form = useFormContext<CreateNudgeSchemaData>();
    const selectedTeamId = form.watch('teamId');

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-2xl">Team & Template</CardTitle>
                <CardDescription>
                    Select your team and optionally start from a template
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <FormField
                    control={form.control}
                    name="teamId"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-base font-semibold">
                                Team
                            </FormLabel>
                            <Select
                                onValueChange={field.onChange}
                                value={field.value}
                            >
                                <FormControl>
                                    <SelectTrigger className="border-border text-foreground bg-white w-full">
                                        <SelectValue placeholder="Select a team" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {returnTeams.map((team) => (
                                        <SelectItem
                                            key={team.id}
                                            value={team.id}
                                        >
                                            {team.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {selectedTeamId && (
                    <NudgeCreateFormTemplateSelect
                        teamId={selectedTeamId}
                        plan={plan}
                    />
                )}
            </CardContent>
        </Card>
    );
};

export default NudgeCreateFormTeamSelection;
