// const getPageTitle = (pathname: string, isDynamic: boolean): string => {
//     // Handle exact matches first
//     if (isDynamic) {
//         // Extract the slug from the pathname, e.g., /team/john-doe -> john-doe
//         const slug = pathname.split('/').pop();
//         return `Team Member: ${slug}`;
//     }

//     switch (pathname) {
//         case '/':
//             return 'Dashboard';
//         case '/settings':
//             return 'Settings';
//         case '/team/create':
//             return 'Create a Team';
//         case '/team/create':
//             return 'Create a Team';
//         default:
//             return 'Page';
//     }
// };

function getPageTitle(pathname: string) {
    // Define static routes
    const staticRoutes: { [key: string]: string } = {
        '/': 'Dashboard',
        '/settings': 'Settings',
        '/team/create': 'Create a Team',
        '/company': 'Company Settings',
        '/team': 'Teams & Users'
    };

    // Define dynamic route patterns
    const dynamicRoutes: {
        pattern: RegExp;
        title: (slug: string) => string;
    }[] = [
        {
            pattern: /^\/team\/[^/]+$/,
            title: (slug: string) => `Manage Team`
        }
    ];

    // Check static routes first
    if (staticRoutes[pathname]) {
        return staticRoutes[pathname];
    }

    // Check dynamic routes
    for (const route of dynamicRoutes) {
        const match = pathname.match(route.pattern);
        if (match) {
            const slug = pathname.split('/').pop()!; // Extract slug
            return route.title(slug);
        }
    }

    // Default case
    return 'Page';
}

export default getPageTitle;
