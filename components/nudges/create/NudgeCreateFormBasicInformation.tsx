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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { CreateNudgeSchemaData } from '@/schemas/nudge';
import { NudgeCreateFormBasicInformationProps } from '@/types/nudge';

const NudgeCreateFormBasicInformation = ({
    returnTeams
}: NudgeCreateFormBasicInformationProps) => {
    const form = useFormContext<CreateNudgeSchemaData>();

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="text-2xl">
                        Basic Information
                    </CardTitle>
                    <CardDescription>
                        Give your nudge a name and description and select your
                        team
                    </CardDescription>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-base font-semibold">
                                Nudge Name
                            </FormLabel>
                            <FormControl>
                                <Input
                                    {...field}
                                    placeholder="e.g., Weekly Team Update"
                                    className="border-border text-foreground bg-white"
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-base font-semibold">
                                Description
                            </FormLabel>
                            <FormControl>
                                <Textarea
                                    {...field}
                                    placeholder="What is this reminder for?"
                                    rows={3}
                                    className="border-border text-foreground resize-none bg-white"
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

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
            </CardContent>
        </Card>
    );
};
export default NudgeCreateFormBasicInformation;
