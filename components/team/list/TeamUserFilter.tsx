'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TeamUserFilterProps } from '@/types/team';
import TeamsList from '@/components/team/list/TeamsList';
import UsersList from '@/components/team/list/UsersList';

const TeamUserFilter = ({
    teamsDb,
    canManageCompany,
    usersWithoutTeams,
    userId
}: TeamUserFilterProps) => {
    const [activeTab, setActiveTab] = useState('teams');
    const [teams, setTeams] = useState(teamsDb.teams || []);
    const [members, setMembers] = useState(teamsDb.members || []);
    const [searchQueryTeams, setSearchQueryTeams] = useState('');
    const [searchQueryUsers, setSearchQueryUsers] = useState('');

    return (
        <>
            {/* Teams Grid */}
            <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="space-y-6"
            >
                <div className="flex items-center justify-between">
                    <TabsList>
                        <TabsTrigger value="teams" className="cursor-pointer">
                            Teams
                        </TabsTrigger>
                        <TabsTrigger value="users" className="cursor-pointer">
                            Users
                        </TabsTrigger>
                    </TabsList>

                    {/* Search */}
                    <div className="relative max-w-md">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />

                        {activeTab === 'teams' && (
                            <Input
                                placeholder="Search teams..."
                                value={searchQueryTeams}
                                onChange={(e) =>
                                    setSearchQueryTeams(e.target.value)
                                }
                                className="pl-10"
                            />
                        )}
                        {activeTab === 'users' && (
                            <Input
                                placeholder="Search users..."
                                value={searchQueryUsers}
                                onChange={(e) =>
                                    setSearchQueryUsers(e.target.value)
                                }
                                className="pl-10"
                            />
                        )}
                    </div>
                </div>
                <TabsContent value="teams" className="space-y-6">
                    <TeamsList
                        teams={teams}
                        searchQueryTeams={searchQueryTeams}
                        setTeams={setTeams}
                        canManageCompany={canManageCompany}
                        userId={userId}
                    />
                </TabsContent>
                <TabsContent value="users" className="space-y-6">
                    <UsersList
                        members={members}
                        searchQueryUsers={searchQueryUsers}
                        canManageCompany={canManageCompany}
                        setMembers={setMembers}
                        usersWithoutTeams={usersWithoutTeams}
                        teams={teams}
                    />
                </TabsContent>
            </Tabs>
        </>
    );
};
export default TeamUserFilter;
