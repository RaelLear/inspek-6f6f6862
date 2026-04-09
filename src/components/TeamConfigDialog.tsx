import { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { UserX, Trash2, Eye, ClipboardList, Users, Upload } from 'lucide-react';
import DelayedConfirmDialog from './DelayedConfirmDialog';

interface Member {
  id: string;
  user_id: string;
  can_inspect: boolean;
  display_name: string | null;
  username: string;
  isOwner?: boolean;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teamId: string;
  teamName: string;
  onTeamDeleted: () => void;
  onMembersChanged: () => void;
}

const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

const TeamConfigDialog = ({ open, onOpenChange, teamId, teamName, onTeamDeleted, onMembersChanged }: Props) => {
  const { user } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);
  const [removeId, setRemoveId] = useState<string | null>(null);
  const [showDeleteTeam, setShowDeleteTeam] = useState(false);
  const [memberInput, setMemberInput] = useState('');
  const [addingMember, setAddingMember] = useState(false);
  const [isOwner, setIsOwner] = useState(false);

  // Export inspections state
  const now = new Date();
  const [exportMonth, setExportMonth] = useState(String(now.getMonth()));
  const [exportYear, setExportYear] = useState(String(now.getFullYear()));
  const [exporting, setExporting] = useState(false);

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    try {
      // Check if current user is owner
      const { data: teamData } = await (supabase.from as any)('teams')
        .select('owner_id')
        .eq('id', teamId)
        .maybeSingle();
      const ownerId = teamData?.owner_id;
      setIsOwner(ownerId === user?.id);

      const { data: tm } = await (supabase.from as any)('team_members')
        .select('id, user_id, can_inspect')
        .eq('team_id', teamId);

      // Collect all user IDs including owner
      const memberUserIds = (tm || []).map((m: any) => m.user_id);
      const allUserIds = ownerId ? [...new Set([ownerId, ...memberUserIds])] : memberUserIds;

      if (allUserIds.length === 0) { setMembers([]); return; }

      const { data: profiles } = await (supabase.from as any)('profiles')
        .select('id, username, display_name')
        .in('id', allUserIds);

      // Build members list: owner first, then team_members
      const result: Member[] = [];

      // Add owner
      if (ownerId) {
        const ownerProfile = profiles?.find((p: any) => p.id === ownerId);
        result.push({
          id: 'owner',
          user_id: ownerId,
          can_inspect: true,
          display_name: ownerProfile?.display_name || null,
          username: ownerProfile?.username || 'owner',
          isOwner: true,
        });
      }

      // Add regular members
      if (tm) {
        for (const m of tm) {
          const p = profiles?.find((p: any) => p.id === m.user_id);
          result.push({
            id: m.id,
            user_id: m.user_id,
            can_inspect: m.can_inspect ?? true,
            display_name: p?.display_name || null,
            username: p?.username || m.user_id.slice(0, 8),
            isOwner: false,
          });
        }
      }

      setMembers(result);
    } finally {
      setLoading(false);
    }
  }, [teamId, user?.id]);

  useEffect(() => {
    if (open) fetchMembers();
  }, [open, fetchMembers]);

  const handleRemoveMember = async () => {
    if (!removeId) return;
    try {
      const { error } = await (supabase.from as any)('team_members')
        .delete().eq('id', removeId);
      if (error) throw error;
      toast.success('Membro removido!');
      setRemoveId(null);
      fetchMembers();
      onMembersChanged();
    } catch (err: any) {
      toast.error('Erro: ' + err.message);
    }
  };

  const handleToggleInspect = async (memberId: string, current: boolean) => {
    try {
      const { error } = await (supabase.from as any)('team_members')
        .update({ can_inspect: !current }).eq('id', memberId);
      if (error) throw error;
      toast.success(!current ? 'Permissão de inspeção concedida!' : 'Inspeção restrita (apenas visualização)');
      fetchMembers();
      onMembersChanged();
    } catch (err: any) {
      toast.error('Erro: ' + err.message);
    }
  };

  const handleAddMember = async () => {
    const input = memberInput.trim();
    if (!input) { toast.error('Email ou username obrigatório'); return; }
    setAddingMember(true);
    try {
      const isEmail = input.includes('@');
      const body = isEmail
        ? { action: 'add_member', teamId, memberEmail: input }
        : { action: 'add_member', teamId, memberUsername: input };
      const { data, error } = await supabase.functions.invoke('team-operations', { body });
      if (error || data?.error) { toast.error(data?.error || 'Erro ao adicionar membro'); return; }
      toast.success('Membro adicionado!');
      setMemberInput('');
      fetchMembers();
      onMembersChanged();
    } catch (err: any) {
      toast.error('Erro: ' + err.message);
    } finally {
      setAddingMember(false);
    }
  };

  const handleDeleteTeam = async () => {
    try {
      const { error } = await (supabase.from as any)('teams').delete().eq('id', teamId);
      if (error) throw error;
      toast.success('Equipe excluída!');
      setShowDeleteTeam(false);
      onOpenChange(false);
      onTeamDeleted();
    } catch (err: any) {
      toast.error('Erro: ' + err.message);
    }
  };

  const handleExportData = async () => {
    if (!user) return;
    setExporting(true);
    try {
      const month = parseInt(exportMonth);
      const year = parseInt(exportYear);

      // Fetch personal inspections
      const { data: personalInspections } = await (supabase.from as any)('inspections')
        .select('*')
        .eq('user_id', user.id)
        .is('team_id', null);

      // Filter by month/year
      const filteredInspections = (personalInspections || []).filter((insp: any) => {
        const parts = insp.inspection_date?.split('/');
        if (!parts || parts.length !== 3) return false;
        return parseInt(parts[1]) - 1 === month && parseInt(parts[2]) === year;
      });

      // Fetch personal extinguishers
      const { data: personalExtinguishers } = await (supabase.from as any)('extinguishers')
        .select('*')
        .eq('user_id', user.id)
        .is('team_id', null);

      // Fetch personal ports
      const { data: personalPorts } = await (supabase.from as any)('ports')
        .select('*')
        .eq('user_id', user.id)
        .is('team_id', null);

      if ((filteredInspections.length === 0) && (!personalExtinguishers || personalExtinguishers.length === 0) && (!personalPorts || personalPorts.length === 0)) {
        toast.error('Nenhum dado pessoal encontrado para exportar.');
        return;
      }

      let exportedCount = 0;

      // Export extinguishers (avoid duplicates by code)
      if (personalExtinguishers && personalExtinguishers.length > 0) {
        const { data: existingExt } = await (supabase.from as any)('extinguishers')
          .select('code')
          .eq('team_id', teamId);
        const existingCodes = new Set((existingExt || []).map((e: any) => e.code));

        const newExts = personalExtinguishers
          .filter((ext: any) => !existingCodes.has(ext.code))
          .map((ext: any) => {
            const { id, created_at, updated_at, ...rest } = ext;
            return { ...rest, team_id: teamId, user_id: user.id };
          });

        if (newExts.length > 0) {
          const { error } = await (supabase.from as any)('extinguishers').insert(newExts);
          if (error) throw error;
          exportedCount += newExts.length;
        }
      }

      // Export ports (avoid duplicates by number)
      if (personalPorts && personalPorts.length > 0) {
        const { data: existingPorts } = await (supabase.from as any)('ports')
          .select('number')
          .eq('team_id', teamId);
        const existingNumbers = new Set((existingPorts || []).map((p: any) => p.number));

        const newPorts = personalPorts
          .filter((port: any) => !existingNumbers.has(port.number))
          .map((port: any) => {
            const { id, created_at, ...rest } = port;
            return { ...rest, team_id: teamId, user_id: user.id };
          });

        if (newPorts.length > 0) {
          const { error } = await (supabase.from as any)('ports').insert(newPorts);
          if (error) throw error;
          exportedCount += newPorts.length;
        }
      }

      // Export inspections
      if (filteredInspections.length > 0) {
        const copies = filteredInspections.map((insp: any) => {
          const { id, created_at, ...rest } = insp;
          return { ...rest, team_id: teamId, user_id: user.id };
        });
        const { error } = await (supabase.from as any)('inspections').insert(copies);
        if (error) throw error;
        exportedCount += copies.length;
      }

      toast.success(`${exportedCount} registros exportados para a equipe!`);
    } catch (err: any) {
      toast.error('Erro ao exportar: ' + err.message);
    } finally {
      setExporting(false);
    }
  };

  const years = Array.from({ length: 3 }, (_, i) => String(now.getFullYear() - 1 + i));

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-sm max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-black">Configurar equipe</DialogTitle>
          </DialogHeader>

          <div className="space-y-1 mb-2">
            <p className="text-xs text-muted-foreground font-bold">Equipe</p>
            <p className="font-bold text-base">{teamName}</p>
          </div>

          {/* Members section */}
          <div className="space-y-2">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Membros</p>
            {loading ? (
              <p className="text-sm text-muted-foreground py-4 text-center">Carregando...</p>
            ) : members.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">Nenhum membro além de você</p>
            ) : (
              members.map(m => (
                <div key={m.id} className="rounded-xl border p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-sm">
                        {m.display_name || m.username}
                        {m.isOwner && <span className="ml-1 text-xs text-muted-foreground">(Dono)</span>}
                        {m.user_id === user?.id && <span className="ml-1 text-xs text-muted-foreground">(Você)</span>}
                      </p>
                      <p className="text-xs text-muted-foreground">@{m.username}</p>
                    </div>
                    {isOwner && !m.isOwner && m.user_id !== user?.id && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => setRemoveId(m.id)}
                      >
                        <UserX className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  {isOwner && !m.isOwner && (
                    <div className="flex gap-2">
                      <Badge
                        variant={m.can_inspect ? 'default' : 'secondary'}
                        className="text-xs cursor-pointer"
                        onClick={() => handleToggleInspect(m.id, m.can_inspect)}
                      >
                        {m.can_inspect ? (
                          <><ClipboardList className="h-3 w-3 mr-1" />Pode inspecionar</>
                        ) : (
                          <><Eye className="h-3 w-3 mr-1" />Apenas visualizar</>
                        )}
                      </Badge>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Add member - only owner */}
          {isOwner && (
            <div className="space-y-2 pt-2 border-t">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Adicionar membro</p>
              <div className="flex gap-2">
                <Input
                  placeholder="email ou username"
                  value={memberInput}
                  onChange={e => setMemberInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddMember()}
                  className="flex-1"
                />
                <Button size="sm" className="font-bold shrink-0" onClick={handleAddMember} disabled={addingMember}>
                  <Users className="h-4 w-4 mr-1" /> Adicionar
                </Button>
              </div>
            </div>
          )}

          {/* Export personal data to team */}
          <div className="space-y-2 pt-2 border-t">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Exportar dados pessoais</p>
            <p className="text-xs text-muted-foreground">Envie seus extintores, pontos e inspeções pessoais do mês selecionado para esta equipe.</p>
            <div className="flex gap-2">
              <Select value={exportMonth} onValueChange={setExportMonth}>
                <SelectTrigger className="flex-1 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map((m, i) => (
                    <SelectItem key={i} value={String(i)}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={exportYear} onValueChange={setExportYear}>
                <SelectTrigger className="w-24 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map(y => (
                    <SelectItem key={y} value={y}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" className="w-full gap-2 font-bold" onClick={handleExportData} disabled={exporting}>
              <Upload className="h-4 w-4" />
              {exporting ? 'Exportando...' : 'Exportar dados para equipe'}
            </Button>
          </div>

          {/* Delete team - only owner */}
          {isOwner && (
            <div className="pt-4 border-t">
              <Button
                variant="outline"
                className="w-full gap-2 border-destructive text-destructive hover:bg-destructive/10 font-bold"
                onClick={() => setShowDeleteTeam(true)}
              >
                <Trash2 className="h-4 w-4" />
                Excluir Equipe
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Remove member - 5s delay */}
      <DelayedConfirmDialog
        open={!!removeId}
        onOpenChange={(v) => { if (!v) setRemoveId(null); }}
        title="Remover membro?"
        description="O membro perderá acesso à equipe e seus dados do espaço compartilhado."
        onConfirm={handleRemoveMember}
        delaySeconds={5}
        confirmLabel="Remover"
        destructive
      />

      {/* Delete team - 5s delay */}
      <DelayedConfirmDialog
        open={showDeleteTeam}
        onOpenChange={setShowDeleteTeam}
        title="Excluir equipe?"
        description={`A equipe "${teamName}" e todos os dados compartilhados serão excluídos permanentemente.`}
        onConfirm={handleDeleteTeam}
        delaySeconds={5}
        confirmLabel="Excluir Equipe"
        destructive
      />
    </>
  );
};

export default TeamConfigDialog;
