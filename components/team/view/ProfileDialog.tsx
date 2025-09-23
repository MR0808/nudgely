'use client';

import { Mail, Users, Calendar, Phone, Building2 } from 'lucide-react';
import parsePhoneNumber, { PhoneNumber } from 'libphonenumber-js';

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle
} from '@/components/ui/dialog';
import { ProfileDialogProps } from '@/types/team';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';

const ProfileDialog = ({ open, setOpen, member }: ProfileDialogProps) => {
    if (!member) return null;

    const phoneNumber: PhoneNumber | undefined = member.user.phoneNumber
        ? parsePhoneNumber(member.user.phoneNumber)
        : undefined;

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-3">
                        <Avatar className="h-12 w-12">
                            <AvatarImage
                                src={
                                    member.user.image ||
                                    '/images/assets/profile.jpg'
                                }
                                alt={`${member.user.name} ${member.user.lastName}`}
                            />
                            <AvatarFallback>
                                {member.user.name.charAt(0)}
                                {member.user.lastName.charAt(0)}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <h2 className="text-xl font-semibold">
                                {`${member.user.name} ${member.user.lastName}`}
                            </h2>
                            <p className="text-sm text-muted-foreground">
                                {member.user.jobTitle || 'No job title'}
                            </p>
                        </div>
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Status and Basic Info */}
                    <div className="flex items-center gap-4">
                        <Badge
                            variant={
                                member.user.status === 'ACTIVE'
                                    ? 'default'
                                    : 'secondary'
                            }
                        >
                            {member.user.status}
                        </Badge>
                        {member.user.teamMembers.length === 0 && (
                            <Badge
                                variant="outline"
                                className="text-orange-600 border-orange-200"
                            >
                                No Team Assigned
                            </Badge>
                        )}
                    </div>

                    <Separator />

                    {/* Contact Information */}
                    <div className="space-y-4">
                        <h3 className="font-medium flex items-center gap-2">
                            <Mail className="h-4 w-4" />
                            Contact Information
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div className="flex items-center gap-2">
                                <Mail className="h-4 w-4 text-muted-foreground" />
                                <span>{member.user.email}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <span>
                                    Joined{' '}
                                    {new Date(
                                        member.user.createdAt
                                    ).toLocaleDateString()}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Phone className="h-4 w-4 text-muted-foreground" />
                                <span>
                                    {phoneNumber
                                        ? phoneNumber.formatNational()
                                        : 'Not specified'}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Building2 className="h-4 w-4 text-muted-foreground" />
                                <span>
                                    {member.role === 'COMPANY_ADMIN'
                                        ? 'Admin'
                                        : 'Member'}
                                </span>
                            </div>
                        </div>
                    </div>

                    <Separator />

                    {/* Teams */}
                    <div className="space-y-4">
                        <h3 className="font-medium flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            Teams ({member.user.teamMembers.length})
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {member.user.teamMembers.map((team) => (
                                <Badge key={team.id} variant="secondary">
                                    {team.team.name}
                                </Badge>
                            ))}
                            {member.user.teamMembers.length === 0 && (
                                <p className="text-sm text-muted-foreground">
                                    Not assigned to any teams
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};
export default ProfileDialog;
