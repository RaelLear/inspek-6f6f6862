import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { Extinguisher, Inspection } from '@/lib/types';
import { supabase } from '@/integrations/supabase/client';
import StatusPanel from '@/components/StatusPanel';
import StatusDetailDialog from '@/components/StatusDetailDialog';
import NotificationBlock from '@/components/NotificationBlock';
import InspectionDialog from '@/components/InspectionDialog';
import ExtinguisherManager from '@/components/ExtinguisherManager';
import SpreadsheetDialog from '@/components/SpreadsheetDialog';
import MetricsDialog from '@/components/MetricsDialog';

import InspectionFieldsEditor from '@/components/InspectionFieldsEditor';
import SubscriptionBlocker, { useSubscription } from '@/components/SubscriptionBlocker';
import OnboardingTutorial from '@/components/OnboardingTutorial';
import TeamConfigDialog from '@/components/TeamConfigDialog';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ClipboardList, List, Table, BarChart3, Sun, Moon, LogOut, Download, Menu, Settings, Users, Plus, CreditCard, Building, RotateCcw, Cog, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';

type LayoutScale = 'compact' | 'normal' | 'spacious';

interface UserProfile {
  id: string;
  username: string;
  display_name: string | null;
}

const Dashboard = () => {
  const { logout, user } = useAuth();
  const { currentTeamId, currentTeamName, teams, setCurrentTeamId, fetchTeams, isPersonal } = useWorkspace();
  const { isActive, getStatusLabel, getStatusColor, isClickable, loading: subLoading } = useSubscription();
  const isMobile = useIsMobile();
  const [extinguishers, setExtinguishers] = useState<Extinguisher[]>([]);
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [showInspection, setShowInspection] = useState(false);
  const [showManager, setShowManager] = useState(false);
  const [showSpreadsheet, setShowSpreadsheet] = useState(false);
  const [showMetrics, setShowMetrics] = useState(false);
  const [showStatusDetail, setShowStatusDetail] = useState(false);
  const [statusFilter, setStatusFilter] = useState('Total');
  const [showSettings, setShowSettings] = useState(false);
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [showTeamConfig, setShowTeamConfig] = useState(false);
  const [showFieldsEditor, setShowFieldsEditor] = useState(false);
  const [teamConfigId, setTeamConfigId] = useState<string | null>(null);
  const [teamName, setTeamName] = useState('');
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [ownProfile, setOwnProfile] = useState<UserProfile | null>(null);

  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('inspek-theme');
    return saved === 'dark';
  });
  const [layoutScale, setLayoutScale] = useState<LayoutScale>(() => {
    return (localStorage.getItem('inspek-layout') as LayoutScale) || 'normal';
  });
  const [defaultWorkspace, setDefaultWorkspace] = useState<string>('personal');

  useEffect(() => {
    const done = localStorage.getItem('inspek-tutorial-done');
    if (!done) setShowTutorial(true);
  }, []);

  // Load default workspace from cloud
  useEffect(() => {
    const loadSettings = async () => {
      if (!user) return;
      const { data } = await (supabase.from as any)('user_settings')
        .select('default_workspace')
        .eq('user_id', user.id)
        .maybeSingle();
      if (data?.default_workspace) {
        setDefaultWorkspace(data.default_workspace);
        if (data.default_workspace !== 'personal' && teams.length > 0) {
          const teamExists = teams.find((t: any) => t.id === data.default_workspace);
          if (teamExists) setCurrentTeamId(data.default_workspace);
        }
      }
    };
    loadSettings();
  }, [user, teams]);

  useEffect(() => {
    if (isDark) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [isDark]);

  useEffect(() => {
    const sizes = { compact: '14px', normal: '16px', spacious: '18px' };
    document.documentElement.style.fontSize = sizes[layoutScale];
    return () => { document.documentElement.style.fontSize = '16px'; };
  }, [layoutScale]);

  const fetchData = useCallback(async () => {
    let extQuery = (supabase.from as any)('extinguishers').select('*');
    let inspQuery = (supabase.from as any)('inspections').select('*');

    if (currentTeamId) {
      extQuery = extQuery.eq('team_id', currentTeamId);
      inspQuery = inspQuery.eq('team_id', currentTeamId);
    } else {
      extQuery = extQuery.is('team_id', null);
      inspQuery = inspQuery.is('team_id', null);
    }

    const [extRes, inspRes] = await Promise.all([extQuery, inspQuery]);
    if (extRes.data) {
      const sorted = (extRes.data as Extinguisher[]).sort((a, b) => {
        const aPort = parseInt(a.port) || 0;
        const bPort = parseInt(b.port) || 0;
        return aPort - bPort;
      });
      setExtinguishers(sorted);
    }
    if (inspRes.data) setInspections(inspRes.data as Inspection[]);
  }, [currentTeamId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    const channel = supabase.channel('realtime-all')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'extinguishers' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'inspections' }, () => fetchData())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchData]);

  useEffect(() => {
    const handler = (e: any) => { e.preventDefault(); setDeferredPrompt(e); };
    window.addEventListener('beforeinstallprompt', handler);
    if (window.matchMedia('(display-mode: standalone)').matches) setIsInstalled(true);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    localStorage.setItem('inspek-theme', next ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark');
  };

  const changeLayoutScale = (scale: LayoutScale) => {
    setLayoutScale(scale);
    localStorage.setItem('inspek-layout', scale);
  };

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const result = await deferredPrompt.userChoice;
    if (result.outcome === 'accepted') {
      setIsInstalled(true);
      toast.success('Aplicativo instalado!');
    }
    setDeferredPrompt(null);
  };

  const handleStatusClick = (filter: string) => {
    setStatusFilter(filter);
    setShowStatusDetail(true);
  };

  const handleCreateTeam = async () => {
    if (!teamName.trim()) { toast.error('Nome obrigatório'); return; }
    const { error } = await (supabase.from as any)('teams').insert({ name: teamName.trim() });
    if (error) { toast.error('Erro ao criar equipe: ' + error.message); return; }
    toast.success('Equipe criada!');
    setTeamName('');
    setShowCreateTeam(false);
    fetchTeams();
  };

  useEffect(() => {
    const fetchOwnProfile = async () => {
      if (!user) { setOwnProfile(null); return; }
      const { data } = await (supabase.from as any)('profiles')
        .select('id, username, display_name')
        .eq('id', user.id)
        .maybeSingle();
      if (data) {
        setOwnProfile(data);
      }
    };
    fetchOwnProfile();
  }, [user]);

  const openTeamConfig = (teamId: string) => {
    setTeamConfigId(teamId);
    setShowTeamConfig(true);
  };

  const statusColor = getStatusColor();
  const statusLabel = getStatusLabel();
  const statusClickable = isClickable();

  const statusColorClass = statusColor === 'green'
    ? 'text-status-approved'
    : statusColor === 'yellow'
    ? 'text-yellow-500'
    : 'text-destructive';

  const configTeam = teams.find(t => t.id === teamConfigId);

  return (
    <div className="min-h-screen bg-background">
      {showTutorial && <OnboardingTutorial onComplete={() => setShowTutorial(false)} />}

      {/* Header - responsive height */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b bg-background/95 backdrop-blur px-4 h-10 md:h-10 h-12">
        <div className="flex items-center gap-1">
          <img src="/logo-site.png" alt="inSpek" className="h-5 w-5 object-contain md:h-5 md:w-5 h-6 w-6" />
          <span className="text-base font-black tracking-tight md:text-base text-lg">inSpek</span>
          {!isPersonal && (
            <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs font-bold text-muted-foreground hidden sm:inline-flex">
              {currentTeamName}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 h-full">
          <Button variant="ghost" size="icon" className="h-full w-8 md:w-8 w-10" onClick={toggleTheme}>
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          {!isInstalled && deferredPrompt && (
            <Button variant="ghost" size="icon" className="h-full w-8 md:w-8 w-10" onClick={handleInstall}>
              <Download className="h-4 w-4" />
            </Button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-full w-8 md:w-8 w-10 relative">
                <Menu className="h-5 w-5" />
                {statusColor === 'red' && (
                  <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-destructive" />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-60">
              {/* User profile info */}
              <div className="px-2 py-2 border-b">
                {ownProfile && (
                  <p className="font-bold text-sm">{ownProfile.display_name || ownProfile.username}</p>
                )}
                {user?.email && (
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                )}
              </div>
              
              {/* Subscription status in menu */}
              <DropdownMenuItem
                className={`gap-2 font-bold ${statusColorClass} ${statusClickable ? 'cursor-pointer' : ''}`}
                disabled={!statusClickable}
                onClick={() => { if (statusClickable) window.open('https://wa.me/5531999647782', '_blank'); }}
              >
                <CreditCard className="h-4 w-4" />
                {statusLabel}
              </DropdownMenuItem>
              <DropdownMenuSeparator />

              {/* Workspace switcher */}
              <DropdownMenuItem
                className={`gap-2 font-bold ${isPersonal ? 'bg-muted' : ''}`}
                onClick={() => setCurrentTeamId(null)}
              >
                <Users className="h-4 w-4" /> Pessoal
              </DropdownMenuItem>

              {teams.map(team => (
                <div key={team.id} className="relative group">
                  <DropdownMenuItem
                    className={`gap-2 font-bold pr-10 ${currentTeamId === team.id ? 'bg-muted' : ''}`}
                    onClick={() => setCurrentTeamId(team.id)}
                  >
                    <Building className="h-4 w-4" /> {team.name}
                  </DropdownMenuItem>
                  <button
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-muted-foreground/10 text-muted-foreground hover:text-foreground transition-colors"
                    onClick={(e) => { e.stopPropagation(); openTeamConfig(team.id); }}
                    title="Configurar equipe"
                  >
                    <Cog className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}

              <DropdownMenuItem className="gap-2" onClick={() => setShowCreateTeam(true)}>
                <Plus className="h-4 w-4" /> Criar Equipe
              </DropdownMenuItem>
              <DropdownMenuSeparator />

              <DropdownMenuItem className="gap-2" onClick={() => setShowSettings(true)}>
                <Settings className="h-4 w-4" /> Configurações
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2" onClick={() => window.open('https://wa.me/5531999647782', '_blank')}>
                <MessageCircle className="h-4 w-4" /> Suporte
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="gap-2 text-destructive" onClick={logout}>
                <LogOut className="h-4 w-4" /> Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Main content */}
      <main className={`mx-auto ${isMobile ? 'max-w-lg px-4' : 'max-w-5xl px-6'} py-6 space-y-6 pb-28`}>
        <StatusPanel extinguishers={extinguishers} onStatusClick={handleStatusClick} />
        <div className={isMobile ? 'space-y-3' : 'grid grid-cols-3 gap-3'}>
          <Button data-tutorial="btn-manager" variant="outline" className={`${isMobile ? 'w-full' : ''} h-14 gap-3 text-base font-bold ${isMobile ? 'justify-start' : ''}`} onClick={() => setShowManager(true)}>
            <List className="h-5 w-5" /> Gerenciador
          </Button>
          <Button data-tutorial="btn-spreadsheet" variant="outline" className={`${isMobile ? 'w-full' : ''} h-14 gap-3 text-base font-bold ${isMobile ? 'justify-start' : ''}`} onClick={() => setShowSpreadsheet(true)}>
            <Table className="h-5 w-5" /> Planilha Geral
          </Button>
          <Button data-tutorial="btn-metrics" variant="outline" className={`${isMobile ? 'w-full' : ''} h-14 gap-3 text-base font-bold ${isMobile ? 'justify-start' : ''}`} onClick={() => setShowMetrics(true)}>
            <BarChart3 className="h-5 w-5" /> Métricas
          </Button>
        </div>
        <NotificationBlock extinguishers={extinguishers} />
      </main>

      {/* FAB */}
      <div data-tutorial="fab-inspection" className={`fixed z-40 ${isMobile ? 'bottom-6 left-1/2 -translate-x-1/2' : 'bottom-8 right-8'}`}>
        <Button className="h-16 w-16 rounded-full shadow-2xl text-background bg-foreground hover:bg-foreground/90" size="icon" onClick={() => setShowInspection(true)}>
          <ClipboardList className="h-7 w-7" />
        </Button>
      </div>

      {/* Dialogs */}
      <InspectionDialog open={showInspection} onOpenChange={setShowInspection} extinguishers={extinguishers} onComplete={fetchData} teamId={currentTeamId} />
      <ExtinguisherManager open={showManager} onOpenChange={setShowManager} extinguishers={extinguishers} onRefresh={fetchData} teamId={currentTeamId} />
      <SpreadsheetDialog open={showSpreadsheet} onOpenChange={setShowSpreadsheet} inspections={inspections} onRefresh={fetchData} />
      <MetricsDialog open={showMetrics} onOpenChange={setShowMetrics} inspections={inspections} extinguishers={extinguishers} />
      <StatusDetailDialog open={showStatusDetail} onOpenChange={setShowStatusDetail} extinguishers={extinguishers} filter={statusFilter} onRefresh={fetchData} />
      <InspectionFieldsEditor open={showFieldsEditor} onOpenChange={setShowFieldsEditor} />
      
      <SubscriptionBlocker />

      {/* Team config */}
      {configTeam && (
        <TeamConfigDialog
          open={showTeamConfig}
          onOpenChange={setShowTeamConfig}
          teamId={configTeam.id}
          teamName={configTeam.name}
          onTeamDeleted={() => {
            fetchTeams();
            if (currentTeamId === configTeam.id) setCurrentTeamId(null);
          }}
          onMembersChanged={fetchTeams}
        />
      )}

      {/* Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-xl font-black">Configurações</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-bold">Tema</label>
              <div className="flex gap-2 mt-2">
                <Button variant={!isDark ? 'default' : 'outline'} className="flex-1 gap-2" onClick={() => { setIsDark(false); localStorage.setItem('inspek-theme', 'light'); document.documentElement.classList.remove('dark'); }}>
                  <Sun className="h-4 w-4" /> Claro
                </Button>
                <Button variant={isDark ? 'default' : 'outline'} className="flex-1 gap-2" onClick={() => { setIsDark(true); localStorage.setItem('inspek-theme', 'dark'); document.documentElement.classList.add('dark'); }}>
                  <Moon className="h-4 w-4" /> Escuro
                </Button>
              </div>
            </div>
            <div>
              <label className="text-sm font-bold">Tamanho do Layout</label>
              <div className="flex gap-2 mt-2">
                {(['compact', 'normal', 'spacious'] as LayoutScale[]).map(scale => (
                  <Button key={scale} variant={layoutScale === scale ? 'default' : 'outline'} className="flex-1 text-xs" onClick={() => changeLayoutScale(scale)}>
                    {scale === 'compact' ? 'Compacto' : scale === 'normal' ? 'Normal' : 'Espaçoso'}
                  </Button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-bold">Abrir por padrão em</label>
              <div className="flex flex-col gap-2 mt-2">
                <Button
                  variant={defaultWorkspace === 'personal' ? 'default' : 'outline'}
                  className="w-full justify-start gap-2 text-sm"
                  onClick={async () => { setDefaultWorkspace('personal'); if (user) { await (supabase.from as any)('user_settings').upsert({ user_id: user.id, default_workspace: 'personal' }, { onConflict: 'user_id' }); } }}
                >
                  <Users className="h-4 w-4" /> Pessoal
                </Button>
                {teams.map(team => (
                  <Button
                    key={team.id}
                    variant={defaultWorkspace === team.id ? 'default' : 'outline'}
                    className="w-full justify-start gap-2 text-sm"
                    onClick={async () => { setDefaultWorkspace(team.id); if (user) { await (supabase.from as any)('user_settings').upsert({ user_id: user.id, default_workspace: team.id }, { onConflict: 'user_id' }); } }}
                  >
                    <Building className="h-4 w-4" /> {team.name}
                  </Button>
                ))}
              </div>
            </div>
            <div>
              <Button variant="outline" className="w-full gap-2" onClick={() => { setShowSettings(false); setShowFieldsEditor(true); }}>
                <Cog className="h-4 w-4" /> Editar Processo de Inspeção
              </Button>
            </div>
            <div>
              <Button variant="outline" className="w-full gap-2" onClick={() => { setShowSettings(false); setShowTutorial(true); }}>
                <RotateCcw className="h-4 w-4" /> Refazer Tutorial
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Team Dialog */}
      <Dialog open={showCreateTeam} onOpenChange={setShowCreateTeam}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-xl font-black">Criar Equipe</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input placeholder="Nome da equipe ou empresa" value={teamName} onChange={e => setTeamName(e.target.value)} />
            <Button className="w-full font-bold" onClick={handleCreateTeam}>Criar</Button>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default Dashboard;
