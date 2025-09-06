'use server';

import * as z from 'zod';
import { randomBytes } from 'crypto';

import { prisma } from '@/lib/prisma';
import { authCheckServer } from '@/lib/authCheck';
import { Meera_Inimai } from 'next/font/google';
import { error } from 'console';

export async function inviteCompanyMember(data: {
    companyId: string;
    email: string;
    role: 'COMPANY_ADMIN' | 'COMPANY_MEMBER';
}) {
    try {
        console.log('[v0] Mock: Inviting company member', data);

        // Mock validation
        if (!data.email?.trim()) {
            return { success: false, error: 'Email is required' };
        }

        if (!data.email.includes('@')) {
            return {
                success: false,
                error: 'Please enter a valid email address'
            };
        }

        // Mock: Check if user is already a company member
        const mockExistingMembers = [
            'john@acme.com',
            'sarah@acme.com',
            'mike@acme.com'
        ];
        if (mockExistingMembers.includes(data.email.toLowerCase().trim())) {
            return {
                success: false,
                error: 'This user is already a company member'
            };
        }

        // Mock: Check if there's already a pending invitation
        const mockPendingInvites = ['alex@acme.com'];
        if (mockPendingInvites.includes(data.email.toLowerCase().trim())) {
            return {
                success: false,
                error: 'An invitation has already been sent to this email'
            };
        }

        // Mock: Generate secure invitation token
        const token = randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

        console.log('[v0] Mock: Created invitation', {
            email: data.email,
            role: data.role,
            token,
            expiresAt
        });

        // Mock: Send email (would integrate with real email service)
        const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/invite/${token}`;
        console.log(
            '[v0] Mock: Would send email to',
            data.email,
            'with URL:',
            inviteUrl
        );

        // Mock: Create audit log
        console.log(
            '[v0] Mock: Created audit log for company member invitation'
        );

        return { success: true, inviteId: `inv_${Date.now()}`, token };
    } catch (error) {
        console.error('Failed to invite company member:', error);
        return { success: false, error: 'Failed to send invitation' };
    }
}

export async function getCompanyAdminMembers() {
    const userSession = await authCheckServer();

    if (!userSession) {
        return {
            data: null,
            error: 'Not authorised'
        };
    }

    const { user, company, userCompany } = userSession;

    if (userCompany.role !== 'COMPANY_ADMIN') {
        return {
            data: null,
            error: 'Not authorised'
        };
    }

    try {
        const members = await prisma.companyMember.findMany({
            where: { companyId: company.id, role: 'COMPANY_ADMIN' },
            include: { user: true }
        });

        if (!members) {
            return { data: null, error: 'Members not found' };
        }
        return { data: members, error: null };
    } catch (error) {
        console.error('Failed to fetch company members:', error);
        return { data: null, error: 'Error fetching members' };
    }
}

export async function getCompanyInvitations(companyId: string) {
    try {
        console.log('[v0] Mock: Fetching company invitations for', companyId);

        // Mock invitations data
        const mockInvitations = [
            {
                id: 'inv_1',
                email: 'alex@acme.com',
                role: 'COMPANY_MEMBER' as const,
                status: 'PENDING' as const,
                expiresAt: new Date('2024-03-07'),
                createdAt: new Date('2024-02-28'),
                companyName: 'Acme Corporation'
            }
        ];

        return mockInvitations;
    } catch (error) {
        console.error('Failed to fetch company invitations:', error);
        return null;
    }
}

export async function cancelCompanyInvitation(inviteId: string) {
    try {
        console.log('[v0] Mock: Cancelling company invitation', inviteId);

        // Mock: Delete the invitation
        console.log('[v0] Mock: Deleted invitation', inviteId);

        // Mock: Create audit log
        console.log('[v0] Mock: Created audit log for cancelled invitation');

        return { success: true };
    } catch (error) {
        console.error('Failed to cancel invitation:', error);
        return { success: false, error: 'Failed to cancel invitation' };
    }
}

export async function removeCompanyMember(memberId: string) {
    try {
        console.log('[v0] Mock: Removing company member', memberId);

        // Mock: Prevent removing yourself
        if (memberId === '1') {
            return {
                success: false,
                error: 'Cannot remove yourself from the company'
            };
        }

        // Mock: Remove the member
        console.log('[v0] Mock: Removed member', memberId);

        // Mock: Create audit log
        console.log('[v0] Mock: Created audit log for removed member');

        return { success: true };
    } catch (error) {
        console.error('Failed to remove company member:', error);
        return { success: false, error: 'Failed to remove company member' };
    }
}

export async function changeCompanyMemberRole(
    memberId: string,
    newRole: 'COMPANY_ADMIN' | 'COMPANY_MEMBER'
) {
    try {
        console.log('[v0] Mock: Changing company member role', {
            memberId,
            newRole
        });

        // Mock: Update the role
        console.log('[v0] Mock: Updated member role', { memberId, newRole });

        // Mock: Create audit log
        console.log('[v0] Mock: Created audit log for role change');

        return { success: true };
    } catch (error) {
        console.error('Failed to change company member role:', error);
        return { success: false, error: 'Failed to change member role' };
    }
}

export async function resendCompanyInvitation(inviteId: string) {
    try {
        console.log('[v0] Mock: Resending company invitation', inviteId);

        // Mock: Resend email
        console.log('[v0] Mock: Resent invitation email');

        return { success: true };
    } catch (error) {
        console.error('Failed to resend invitation:', error);
        return { success: false, error: 'Failed to resend invitation' };
    }
}
