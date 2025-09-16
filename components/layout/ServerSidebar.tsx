import { AppSidebar } from '@/components/layout/AppSidebar';
import { authCheck } from '@/lib/authCheck';

const ServerSidebar = async () => {
    const userSession = await authCheck();

    return <AppSidebar variant="inset" userSession={userSession} />;
};
export default ServerSidebar;
