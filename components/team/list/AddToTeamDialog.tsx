'use client';

import { useEffect, useState, useTransition } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Users, Plus, Minus, Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { AddToTeamDialogProps } from '@/types/team';
import { updateTeamMember } from '@/actions/teamMember';

const AddToTeamDialog = ({
    user,
    teams,
    open,
    setOpen,
    setMembers
}: AddToTeamDialogProps) => {
    const [isPending, startTransition] = useTransition();
    const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>([]);
    const [teamsToAdd, setTeamsToAdd] = useState<string[]>([]);
    const [teamsToRemove, setTeamsToRemove] = useState<string[]>([]);
    const [hasChanges, setHasChanges] = useState<boolean>(false);

    useEffect(() => {
        if (user) {
            setSelectedTeamIds(
                user.user.teamMembers.map((team) => team.teamId)
            );
        }
    }, [user]);

    if (!user) return null;

    const currentTeamIds = user.user.teamMembers.map((team) => team.teamId);

    const handleTeamToggle = (teamId: string) => {
        const tempSelectedTeamIds = selectedTeamIds.includes(teamId)
            ? selectedTeamIds.filter((id) => id !== teamId)
            : [...selectedTeamIds, teamId];
        const tempTeamsToAdd = tempSelectedTeamIds.filter(
            (id) => !currentTeamIds.includes(id)
        );
        const tempTeamsToRemove = currentTeamIds.filter(
            (id) => !tempSelectedTeamIds.includes(id)
        );
        const tempHasChanges =
            tempTeamsToAdd.length > 0 || tempTeamsToRemove.length > 0;
        setSelectedTeamIds(tempSelectedTeamIds);
        setTeamsToAdd(tempTeamsToAdd);
        setTeamsToRemove(tempTeamsToRemove);
        setHasChanges(tempHasChanges);
    };

    const handleSave = async () => {
        startTransition(async () => {
            const data = await updateTeamMember(
                user.user.id,
                teamsToAdd,
                teamsToRemove
            );
            if (data.error) {
                toast.error(data.error);
            }
            if (data.data) {
                setMembers(data.data);
                toast.success('Member teams updated');
                setOpen(false);
            }
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                            <AvatarImage
                                src={
                                    user.user.image ||
                                    '/images/assets/profile.jpg'
                                }
                                alt={`${user.user.name} ${user.user.lastName}`}
                            />
                            <AvatarFallback>
                                {user.user.name.charAt(0)}
                                {user.user.lastName.charAt(0)}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <h2 className="text-lg font-semibold">
                                Manage Team Assignments
                            </h2>
                            <p className="text-sm text-muted-foreground">
                                {`${user.user.name} ${user.user.lastName}`}
                            </p>
                        </div>
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Current Status */}
                    <div className="flex items-center gap-2">
                        <Badge variant="outline">
                            Currently in {user.user.teamMembers.length} team
                            {user.user.teamMembers.length !== 1 ? 's' : ''}
                        </Badge>
                        {user.user.teamMembers.length === 0 && (
                            <Badge
                                variant="outline"
                                className="text-orange-600 border-orange-200"
                            >
                                No Teams
                            </Badge>
                        )}
                    </div>

                    <Separator />

                    {/* Team Selection */}
                    <div className="space-y-4">
                        <h3 className="font-medium flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            Available Teams
                        </h3>

                        <ScrollArea className="h-64 border rounded-lg p-4">
                            <div className="space-y-3">
                                {teams.map((team) => {
                                    const isSelected = selectedTeamIds.includes(
                                        team.id
                                    );
                                    const wasOriginallySelected =
                                        currentTeamIds.includes(team.id);

                                    return (
                                        <div
                                            key={team.id}
                                            className="flex items-center space-x-3 p-2 rounded-lg hover:bg-muted/50"
                                        >
                                            <Checkbox
                                                id={team.id}
                                                checked={isSelected}
                                                onCheckedChange={() =>
                                                    handleTeamToggle(team.id)
                                                }
                                            />
                                            <div className="flex-1 space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <label
                                                        htmlFor={team.id}
                                                        className="text-sm font-medium cursor-pointer"
                                                    >
                                                        {team.name}
                                                    </label>
                                                    {!wasOriginallySelected &&
                                                        isSelected && (
                                                            <Badge
                                                                variant="outline"
                                                                className="text-xs text-green-600 border-green-200"
                                                            >
                                                                <Plus className="h-3 w-3 mr-1" />
                                                                Adding
                                                            </Badge>
                                                        )}
                                                    {wasOriginallySelected &&
                                                        !isSelected && (
                                                            <Badge
                                                                variant="outline"
                                                                className="text-xs text-red-600 border-red-200"
                                                            >
                                                                <Minus className="h-3 w-3 mr-1" />
                                                                Removing
                                                            </Badge>
                                                        )}
                                                </div>
                                                <p className="text-xs text-muted-foreground">
                                                    {team.members.length}{' '}
                                                    members
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </ScrollArea>
                    </div>

                    {/* Changes Summary */}
                    {hasChanges && (
                        <>
                            <Separator />
                            <div className="space-y-3">
                                <h4 className="font-medium text-sm">
                                    Changes Summary:
                                </h4>
                                {teamsToAdd.length > 0 && (
                                    <div className="text-sm">
                                        <span className="text-green-600 font-medium">
                                            Adding to teams:
                                        </span>
                                        <div className="flex flex-wrap gap-1 mt-1">
                                            {teamsToAdd.map((teamId) => {
                                                const team = teams.find(
                                                    (t) => t.id === teamId
                                                );
                                                return team ? (
                                                    <Badge
                                                        key={teamId}
                                                        variant="outline"
                                                        className="text-green-600 border-green-200"
                                                    >
                                                        {team.name}
                                                    </Badge>
                                                ) : null;
                                            })}
                                        </div>
                                    </div>
                                )}
                                {teamsToRemove.length > 0 && (
                                    <div className="text-sm">
                                        <span className="text-red-600 font-medium">
                                            Removing from teams:
                                        </span>
                                        <div className="flex flex-wrap gap-1 mt-1">
                                            {teamsToRemove.map((teamId) => {
                                                const team =
                                                    user.user.teamMembers.find(
                                                        (t) =>
                                                            t.teamId === teamId
                                                    );
                                                return team ? (
                                                    <Badge
                                                        key={teamId}
                                                        variant="outline"
                                                        className="text-red-600 border-red-200"
                                                    >
                                                        {team.team.name}
                                                    </Badge>
                                                ) : null;
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-4">
                        <Button
                            variant="outline"
                            className="flex-1 bg-transparent"
                            onClick={() => setOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            className="flex-1"
                            onClick={handleSave}
                            disabled={!hasChanges || isPending}
                        >
                            {isPending ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />{' '}
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save className="h-4 w-4 mr-2" /> Save
                                    Changes
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default AddToTeamDialog;
