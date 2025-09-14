import { getUserTeams } from '@/actions/team';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { authCheck } from '@/lib/authCheck';

const ServerSidebar = async () => {
    const userSession = await authCheck();
    const teams = await getUserTeams();

    return (
        <AppSidebar
            variant="inset"
            userSession={userSession}
            teams={teams || []}
        />
    );
};
export default ServerSidebar;
