const getPageTitle = (pathname: string): string => {
    // Handle exact matches first
    switch (pathname) {
        case '/':
            return 'Dashboard';
        case '/settings':
            return 'Settings';
        case '/team/create':
            return 'Create a Team';
        default:
            return 'Page';
    }
};

export default getPageTitle;
