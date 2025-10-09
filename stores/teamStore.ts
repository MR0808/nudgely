import { UserTeams, UserTeam } from '@/types/nudge';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface TeamStore {
    selectedTeam: UserTeam | null;
    setSelectedTeam: (team: UserTeam | null) => void;
    isReloadTeam: boolean;
    setIsReloadTeam: (isReload: boolean) => void;
}

export const useTeamStore = create(
    persist<TeamStore>(
        (set) => ({
            selectedTeam: null,
            setSelectedTeam: (team) => set({ selectedTeam: team }),
            isReloadTeam: false,
            setIsReloadTeam: (isReload) => set({ isReloadTeam: isReload })
        }),
        { name: 'team-storage' } // Key for localStorage
    )
);
