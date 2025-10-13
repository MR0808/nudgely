// 'use client';

// import type * as z from 'zod';
// import { useTransition, useState } from 'react';
// import { zodResolver } from '@hookform/resolvers/zod';
// import { useForm } from 'react-hook-form';
// import { toast } from 'sonner';
// import { IntervalUnit, NudgeFrequency } from '@/generated/prisma';

// import {
//     Form,
//     FormControl,
//     FormField,
//     FormItem,
//     FormLabel,
//     FormMessage
// } from '@/components/ui/form';
// import { Input } from '@/components/ui/input';
// import { Button } from '@/components/ui/button';
// import { Textarea } from '@/components/ui/textarea';
// import { Label } from '@/components/ui/label';
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// import {
//     Select,
//     SelectContent,
//     SelectItem,
//     SelectTrigger,
//     SelectValue
// } from '@/components/ui/select';
// import { useNudgeCreateStore } from '@/stores/nudgeCreateStore';
// import { NudgeCreateFormProps } from '@/types/nudge';
// import { CreateNudgeSchema } from '@/schemas/nudge';
// import { HourSelector } from '@/components/ui/hour-selector';

// const NudgeCreateForm = ({
//     returnTeams,
//     initialTeam,
//     initialTimezone
// }: NudgeCreateFormProps) => {
//     const [isPending, startTransition] = useTransition();

//     const {
//         title,
//         setTitle,
//         description,
//         setDescription,
//         frequency,
//         setFrequency,
//         time,
//         setTime,
//         recipient,
//         setRecipient
//     } = useNudgeCreateStore();

//     const form = useForm<z.infer<typeof CreateNudgeSchema>>({
//         resolver: zodResolver(CreateNudgeSchema),
//         defaultValues: {
//             frequency: 'DAILY',
//             interval: 1,
//             endType: 'NEVER',
//             timezone: initialTimezone,
//             recipients: [{ firstName: '', email: '' }],
//             timeOfDay: '9:00 AM',
//             teamId: initialTeam
//         }
//     });

//     const onSubmit = (values: z.infer<typeof CreateNudgeSchema>) => {
//         startTransition(async () => {
//             // const data = await createTeam(values, companyId);
//             // if (data.error) {
//             //     toast.error(data.error);
//             // }
//             // if (data.data) {
//             //     if (userSession) {
//             //         await logTeamCreated(userSession.user.id, {
//             //             teamId: data.data.id,
//             //             teamName: data.data.name
//             //         });
//             //     }
//             //     toast.success('Team successfully created');
//             //     router.push(`/team/${data.data.slug}`);
//             // }
//         });
//     };

//     return (
//         <Card>
//             <CardHeader>
//                 <CardTitle>Create a New Nudge</CardTitle>
//             </CardHeader>
//             <CardContent>
//                 <Form {...form}>
//                     <form
//                         onSubmit={form.handleSubmit(onSubmit)}
//                         className="space-y-6"
//                     >
//                         <div>
//                             <FormField
//                                 control={form.control}
//                                 name="team"
//                                 render={({ field }) => (
//                                     <FormItem>
//                                         <FormLabel>Team *</FormLabel>
//                                         <Select
//                                             onValueChange={field.onChange}
//                                             defaultValue={field.value}
//                                         >
//                                             <FormControl>
//                                                 <SelectTrigger className="w-full">
//                                                     <SelectValue placeholder="Select the team" />
//                                                 </SelectTrigger>
//                                             </FormControl>
//                                             <SelectContent>
//                                                 {returnTeams.map((team) => (
//                                                     <SelectItem
//                                                         value={team.id}
//                                                         key={team.id}
//                                                     >
//                                                         {team.name}
//                                                     </SelectItem>
//                                                 ))}
//                                             </SelectContent>
//                                         </Select>
//                                         <FormMessage />
//                                     </FormItem>
//                                 )}
//                             />
//                         </div>
//                         <div>
//                             <FormField
//                                 control={form.control}
//                                 name="name"
//                                 render={({ field }) => (
//                                     <FormItem>
//                                         <FormLabel>Title *</FormLabel>
//                                         <FormControl>
//                                             <Input
//                                                 {...field}
//                                                 placeholder="e.g. Send weekly client report"
//                                             />
//                                         </FormControl>
//                                         <FormMessage />
//                                     </FormItem>
//                                 )}
//                             />
//                         </div>

//                         <div>
//                             <FormField
//                                 control={form.control}
//                                 name="description"
//                                 render={({ field }) => (
//                                     <FormItem>
//                                         <FormLabel>Description *</FormLabel>
//                                         <FormControl>
//                                             <Textarea
//                                                 {...field}
//                                                 placeholder="Optional details…"
//                                             />
//                                         </FormControl>
//                                         <FormMessage />
//                                     </FormItem>
//                                 )}
//                             />
//                         </div>

//                         <div>
//                             <FormField
//                                 control={form.control}
//                                 name="frequency"
//                                 render={({ field }) => (
//                                     <FormItem>
//                                         <FormLabel>Frequency *</FormLabel>
//                                         <Select
//                                             onValueChange={field.onChange}
//                                             defaultValue={field.value}
//                                         >
//                                             <FormControl>
//                                                 <SelectTrigger className="w-full">
//                                                     <SelectValue placeholder="Select your frequency" />
//                                                 </SelectTrigger>
//                                             </FormControl>
//                                             <SelectContent>
//                                                 {Object.values(
//                                                     NudgeFrequency
//                                                 ).map((frequency, index) => (
//                                                     <SelectItem
//                                                         value={frequency}
//                                                         key={index}
//                                                     >
//                                                         {frequency[0].toUpperCase() +
//                                                             frequency
//                                                                 .slice(1)
//                                                                 .toLowerCase()}
//                                                     </SelectItem>
//                                                 ))}
//                                             </SelectContent>
//                                         </Select>
//                                         <FormMessage />
//                                     </FormItem>
//                                 )}
//                             />
//                         </div>

//                         <div>
//                             <HourSelector
//                                 value={dueHour}
//                                 onChange={(value) =>
//                                     form.setValue('dueHour', value)
//                                 }
//                                 label="Scheduled time"
//                             />
//                         </div>

//                         <div>
//                             <Label htmlFor="recipients">Recipients *</Label>
//                             <Input
//                                 id="recipients"
//                                 name="recipients"
//                                 placeholder="Enter email(s)"
//                                 required
//                                 value={recipient}
//                                 onChange={(e) => setRecipient(e.target.value)}
//                             />
//                         </div>

//                         <Button type="submit" disabled={isPending}>
//                             {isPending ? 'Creating...' : 'Create Nudge'}
//                         </Button>
//                     </form>
//                 </Form>
//             </CardContent>
//         </Card>
//     );
// };
// export default NudgeCreateForm;
