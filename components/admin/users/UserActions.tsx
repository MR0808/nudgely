'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MoreVertical, Ban, CheckCircle, Shield, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
    updateUserRole,
    toggleUserStatus,
    banUser,
    unbanUser
} from '@/actions/admin/users';

type User = {
    id: string;
    name: string | null;
    lastName: string | null;
    email: string;
    role: string;
    status: string;
    banned: boolean | null;
    banReason: string | null;
    banExpires: Date | null;
};

type DialogType = 'role' | 'ban' | 'delete' | null;

export function UserActions({
    user,
    canModify
}: {
    user: User;
    canModify: boolean;
}) {
    const router = useRouter();
    const [openDialog, setOpenDialog] = useState<DialogType>(null);
    const [loading, setLoading] = useState(false);

    // Form states
    const [selectedRole, setSelectedRole] = useState<'USER' | 'SITE_ADMIN'>(
        user.role as 'USER' | 'SITE_ADMIN'
    );
    const [banReason, setBanReason] = useState('');
    const [banExpires, setBanExpires] = useState('');

    const handleUpdateRole = async () => {
        setLoading(true);
        try {
            await updateUserRole(user.id, selectedRole);
            toast.success('Role updated', {
                description: `User role changed to ${selectedRole}`
            });
            setOpenDialog(null);
            router.refresh();
        } catch (error) {
            toast.error('Error', {
                description: 'Failed to update user role'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleToggleStatus = async () => {
        setLoading(true);
        try {
            await toggleUserStatus(user.id);
            toast.success('Status updated', {
                description: `User ${user.status === 'ACTIVE' ? 'disabled' : 'enabled'} successfully`
            });
            router.refresh();
        } catch (error) {
            toast.error('Error', {
                description: 'Failed to update user status'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleBanUser = async () => {
        if (!banReason.trim()) {
            toast.error('Error', {
                description: 'Please provide a ban reason'
            });
            return;
        }

        setLoading(true);
        try {
            await banUser(
                user.id,
                banReason,
                banExpires ? new Date(banExpires) : undefined
            );
            toast.success('User banned', {
                description: 'User has been banned successfully'
            });
            setOpenDialog(null);
            setBanReason('');
            setBanExpires('');
            router.refresh();
        } catch (error) {
            toast.error('Error', {
                description: 'Failed to ban user'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleUnbanUser = async () => {
        setLoading(true);
        try {
            await unbanUser(user.id);
            toast.success('User unbanned', {
                description: 'User has been unbanned successfully'
            });
            router.refresh();
        } catch (error) {
            toast.error('Error', {
                description: 'Failed to unban user'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteUser = async () => {
        setLoading(true);
        try {
            // Delete actually just disables the user
            await toggleUserStatus(user.id);
            toast.success('User disabled', {
                description: 'User has been disabled successfully'
            });
            setOpenDialog(null);
            router.refresh();
        } catch (error) {
            toast.error('Error', {
                description: 'Failed to disable user'
            });
        } finally {
            setLoading(false);
        }
    };

    if (!canModify) {
        return (
            <Button variant="ghost" size="icon" disabled>
                <MoreVertical className="h-4 w-4" />
            </Button>
        );
    }

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="cursor-pointer"
                    >
                        <MoreVertical className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem
                        onClick={() => setOpenDialog('role')}
                        className="cursor-pointer"
                    >
                        <Shield className="h-4 w-4 mr-2" />
                        Change Role
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                        onClick={handleToggleStatus}
                        disabled={loading}
                        className="cursor-pointer"
                    >
                        {user.status === 'ACTIVE' ? (
                            <>
                                <Ban className="h-4 w-4 mr-2" />
                                <span className="text-orange-600">
                                    Disable Account
                                </span>
                            </>
                        ) : (
                            <>
                                <CheckCircle className="h-4 w-4 mr-2" />
                                <span className="text-green-600">
                                    Enable Account
                                </span>
                            </>
                        )}
                    </DropdownMenuItem>
                    {user.banned ? (
                        <DropdownMenuItem
                            onClick={handleUnbanUser}
                            disabled={loading}
                            className="cursor-pointer"
                        >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            <span className="text-green-600">Unban User</span>
                        </DropdownMenuItem>
                    ) : (
                        <DropdownMenuItem
                            onClick={() => setOpenDialog('ban')}
                            className="cursor-pointer"
                        >
                            <Ban className="h-4 w-4 mr-2" />
                            <span className="text-destructive">Ban User</span>
                        </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                        onClick={() => setOpenDialog('delete')}
                        className="cursor-pointer"
                    >
                        <Trash2 className="h-4 w-4 mr-2" />
                        <span className="text-destructive">Delete User</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            {/* Role Change Dialog */}
            <Dialog
                open={openDialog === 'role'}
                onOpenChange={(open) => !open && setOpenDialog(null)}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Change User Role</DialogTitle>
                        <DialogDescription>
                            Update the role for {user.name} {user.lastName}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="role">Role</Label>
                            <Select
                                value={selectedRole}
                                onValueChange={(value) =>
                                    setSelectedRole(
                                        value as 'USER' | 'SITE_ADMIN'
                                    )
                                }
                            >
                                <SelectTrigger id="role">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="USER">User</SelectItem>
                                    <SelectItem value="SITE_ADMIN">
                                        Site Admin
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setOpenDialog(null)}
                            disabled={loading}
                        >
                            Cancel
                        </Button>
                        <Button onClick={handleUpdateRole} disabled={loading}>
                            {loading ? 'Updating...' : 'Update Role'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Ban User Dialog */}
            <Dialog
                open={openDialog === 'ban'}
                onOpenChange={(open) => !open && setOpenDialog(null)}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Ban User</DialogTitle>
                        <DialogDescription>
                            Ban {user.name} {user.lastName} from the platform
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="banReason">Ban Reason *</Label>
                            <Textarea
                                id="banReason"
                                placeholder="Provide a reason for banning this user..."
                                value={banReason}
                                onChange={(e) => setBanReason(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="banExpires">
                                Ban Expires (Optional)
                            </Label>
                            <Input
                                id="banExpires"
                                type="datetime-local"
                                value={banExpires}
                                onChange={(e) => setBanExpires(e.target.value)}
                            />
                            <p className="text-sm text-muted-foreground">
                                Leave empty for permanent ban
                            </p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setOpenDialog(null)}
                            disabled={loading}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleBanUser}
                            disabled={loading}
                            variant="destructive"
                        >
                            {loading ? 'Banning...' : 'Ban User'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete User Dialog */}
            <Dialog
                open={openDialog === 'delete'}
                onOpenChange={(open) => !open && setOpenDialog(null)}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Disable User</DialogTitle>
                        <DialogDescription>
                            This will disable {user.name} {user.lastName}'s
                            account. They will not be able to access the
                            platform.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setOpenDialog(null)}
                            disabled={loading}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleDeleteUser}
                            disabled={loading}
                            variant="destructive"
                        >
                            {loading ? 'Disabling...' : 'Disable User'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
