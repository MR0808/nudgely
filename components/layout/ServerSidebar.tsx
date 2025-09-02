import { getCompanyForSelector } from '@/actions/company';
import { getUserTeams } from '@/actions/team';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { authCheck } from '@/lib/authCheck';

const ServerSidebar = async () => {
    const userSession = await authCheck();
    const teams = await getUserTeams();
    const company = await getCompanyForSelector();

    if (!company.company) return null;

    return (
        <AppSidebar
            variant="inset"
            userSession={userSession}
            teams={teams || []}
            company={company.company}
        />
    );
};
export default ServerSidebar;
