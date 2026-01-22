import { createAccessControl } from 'better-auth/plugins/access';
import { defaultStatements, adminAc } from 'better-auth/plugins/admin/access';

const statements = {
    ...defaultStatements,
    posts: ['create', 'read', 'update', 'delete', 'update:own', 'delete:own']
} as const;

export const ac = createAccessControl(statements);

const SiteRole = {
    USER: 'USER',
    SITE_ADMIN: 'SITE_ADMIN'
} as const;

export const roles = {
    [SiteRole.USER]: ac.newRole({
        posts: ['create', 'read', 'update:own', 'delete:own']
    }),
    [SiteRole.SITE_ADMIN]: ac.newRole({
        ...adminAc.statements,
        posts: [
            'create',
            'read',
            'update',
            'delete',
            'update:own',
            'delete:own'
        ]
    })
};

