import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';

interface Team {
  id: string;
  name: string;
  owner_id: string;
}

interface WorkspaceContextType {
  currentTeamId: string | null;
  currentTeamName: string;
  teams: Team[];
  setCurrentTeamId: (id: string | null) => void;
  fetchTeams: () => Promise<void>;
  isPersonal: boolean;
}

const WorkspaceContext = createContext<WorkspaceContextType>({
  currentTeamId: null,
  currentTeamName: 'Pessoal',
  teams: [],
  setCurrentTeamId: () => {},
  fetchTeams: async () => {},
  isPersonal: true,
});

export const useWorkspace = () => useContext(WorkspaceContext);

export const WorkspaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [currentTeamId, setCurrentTeamId] = useState<string | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);

  const fetchTeams = useCallback(async () => {
    if (!user) { setTeams([]); return; }
    const { data } = await (supabase.from as any)('teams').select('*');
    setTeams(data || []);
  }, [user]);

  useEffect(() => { fetchTeams(); }, [fetchTeams]);

  const currentTeamName = currentTeamId
    ? teams.find(t => t.id === currentTeamId)?.name || 'Equipe'
    : 'Pessoal';

  return (
    <WorkspaceContext.Provider value={{
      currentTeamId,
      currentTeamName,
      teams,
      setCurrentTeamId,
      fetchTeams,
      isPersonal: !currentTeamId,
    }}>
      {children}
    </WorkspaceContext.Provider>
  );
};