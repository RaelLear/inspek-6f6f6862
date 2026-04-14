import { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Extinguisher, daysUntil, formatDateInput, formatMonthYearInput, formatYearInput, monthYearToFullDate, yearToFullDate, displayWarranty, displayThirdLevel, getTodayFormatted } from '@/lib/types';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import Numpad from './Numpad';
import DelayedConfirmDialog from './DelayedConfirmDialog';
import { Plus, Pencil, Trash2, AlertTriangle, MapPin, MessageSquare, Save, Ban, RefreshCw, RotateCcw } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface Port {
  id: string;
  number: string;
  description: string | null;
  image_url: string | null;
  created_at: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  extinguishers: Extinguisher[];
  onRefresh: () => void;
  teamId?: string | null;
}

type Mode = 'list' | 'add' | 'edit' | 'numpad' | 'addPort';

const ExtinguisherManager = ({ open, onOpenChange, extinguishers, onRefresh, teamId }: Props) => {
  const { user } = useAuth();
  const [mode, setMode] = useState<Mode>('list');
  const [editId, setEditId] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [port, setPort] = useState('');
  const [portDescription, setPortDescription] = useState('');
  const [type, setType] = useState('Pó ABC');
  const [weight, setWeight] = useState('6kg');
  const [warrantyExpiry, setWarrantyExpiry] = useState('');
  const [thirdLevel, setThirdLevel] = useState('');
  const [numpadTarget, setNumpadTarget] = useState<string>('');
  const [numpadValue, setNumpadValue] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [ports, setPorts] = useState<Port[]>([]);
  const [newPortNumber, setNewPortNumber] = useState('');
  const [newPortDescription, setNewPortDescription] = useState('');
  const [deletePortId, setDeletePortId] = useState<string | null>(null);
  const [reviewId, setReviewId] = useState<string | null>(null);
  const [reviewReason, setReviewReason] = useState<string>('Utilizado');
  const [reviewDescription, setReviewDescription] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchPorts = useCallback(async () => {
    let query = supabase.from('ports').select('*').order('number');
    if (teamId) {
      query = query.eq('team_id', teamId);
    } else {
      query = query.is('team_id', null);
    }
    const { data } = await query;
    if (data) setPorts(data as Port[]);
  }, [teamId]);

  useEffect(() => {
    if (open) fetchPorts();
  }, [open, fetchPorts]);

  const sortedExtinguishers = [...extinguishers].sort((a, b) => {
    const aPort = parseInt(a.port) || 0;
    const bPort = parseInt(b.port) || 0;
    return aPort - bPort;
  });

  const isPortInactive = (portNumber: string) => {
    const p = ports.find(pt => pt.number === portNumber);
    return p?.description?.includes('[INATIVO]') || false;
  };

  const emptyPorts = ports
    .filter(p => {
      if (p.description?.includes('[INATIVO]')) return false;
      return !extinguishers.some(e => e.port === p.number && e.status !== 'Vazio' && e.status !== 'Em Revisão' && e.status !== 'Obstruído');
    })
    .sort((a, b) => (parseInt(a.number) || 0) - (parseInt(b.number) || 0));

  const getPortDescription = (portNumber: string) => {
    const p = ports.find(pt => pt.number === portNumber);
    return p?.description || null;
  };

  const resetForm = () => {
    setCode(''); setPort(''); setPortDescription(''); setType('Pó ABC'); setWeight('6kg');
    setWarrantyExpiry(''); setThirdLevel(''); setEditId(null);
  };

  const resetPortForm = () => {
    setNewPortNumber(''); setNewPortDescription('');
  };

  const openNumpad = (target: string, currentValue: string) => {
    setNumpadTarget(target);
    setNumpadValue(currentValue.replace(/\D/g, ''));
    setMode('numpad');
  };

  const handleNumpadConfirm = () => {
    if (numpadTarget === 'code') setCode(numpadValue);
    else if (numpadTarget === 'port') {
      setPort(numpadValue);
      const existing = ports.find(p => p.number === numpadValue);
      if (existing) setPortDescription(existing.description || '');
      else setPortDescription('');
    }
    else if (numpadTarget === 'warrantyExpiry') setWarrantyExpiry(formatMonthYearInput(numpadValue));
    else if (numpadTarget === 'thirdLevel') setThirdLevel(formatYearInput(numpadValue));
    else if (numpadTarget === 'weight') setWeight(numpadValue + 'kg');
    else if (numpadTarget === 'newPort') setNewPortNumber(numpadValue);
    setMode(numpadTarget === 'newPort' ? 'addPort' : (editId ? 'edit' : 'add'));
  };

  const handleSave = async () => {
    if (!code || !port) { toast.error('Código e posto são obrigatórios.'); return; }
    setSaving(true);
    try {
      const existingPort = ports.find(p => p.number === port);
      if (!existingPort) {
        await supabase.from('ports').insert({ number: port, description: portDescription || null, ...(teamId ? { team_id: teamId } : {}) });
      } else if (portDescription && portDescription !== existingPort.description) {
        await supabase.from('ports').update({ description: portDescription }).eq('id', existingPort.id);
      }

      const data = {
        code, port, type, weight,
        warranty_expiry: warrantyExpiry ? monthYearToFullDate(warrantyExpiry) : null,
        third_level: thirdLevel ? yearToFullDate(thirdLevel) : null,
        ...(teamId ? { team_id: teamId } : {}),
      };
      if (editId) {
        const { error } = await supabase.from('extinguishers').update(data).eq('id', editId);
        if (error) throw error;
        toast.success('Extintor atualizado!');
      } else {
        const { error } = await supabase.from('extinguishers').insert(data);
        if (error) throw error;
        toast.success('Extintor adicionado!');
      }
      resetForm();
      setMode('list');
      fetchPorts();
      onRefresh();
    } catch (err: any) {
      toast.error('Erro: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const { error } = await supabase.from('extinguishers').delete().eq('id', deleteId);
      if (error) throw error;
      toast.success('Extintor removido!');
      setDeleteId(null);
      onRefresh();
    } catch (err: any) {
      toast.error('Erro: ' + err.message);
    }
  };

  const handleSendToReview = async () => {
    if (reviewReason === 'Outro' && !reviewDescription.trim()) {
      toast.error('Descrição obrigatória para motivo "Outro".');
      return;
    }
    if (!reviewId || !user) return;
    try {
      const today = getTodayFormatted();
      const { error } = await supabase.from('extinguishers').update({
        status: 'Em Revisão',
        review_send_date: today,
      }).eq('id', reviewId);
      if (error) throw error;

      // Increment monthly review count
      const todayParts = today.split('/');
      const month = parseInt(todayParts[1]);
      const year = parseInt(todayParts[2]);

      let query = (supabase.from as any)('monthly_review_counts')
        .select('*')
        .eq('month', month)
        .eq('year', year)
        .eq('user_id', user.id);
      if (teamId) {
        query = query.eq('team_id', teamId);
      } else {
        query = query.is('team_id', null);
      }
      const { data: existing } = await query.maybeSingle();

      if (existing) {
        await (supabase.from as any)('monthly_review_counts')
          .update({ count: (existing.count || 0) + 1, updated_at: new Date().toISOString() })
          .eq('id', existing.id);
      } else {
        await (supabase.from as any)('monthly_review_counts')
          .insert({ month, year, count: 1, ...(teamId ? { team_id: teamId } : {}) });
      }

      toast.success('Extintor enviado para revisão!');
      setReviewId(null);
      setReviewReason('Utilizado');
      setReviewDescription('');
      onRefresh();
    } catch (err: any) {
      toast.error('Erro: ' + err.message);
    }
  };

  const existingPortMatch = ports.find(p => p.number === newPortNumber);

  useEffect(() => {
    if (existingPortMatch) {
      setNewPortDescription(existingPortMatch.description?.replace(' [INATIVO]', '') || '');
    }
  }, [existingPortMatch?.id]);

  const handleAddPort = async () => {
    if (!newPortNumber) { toast.error('Número do posto é obrigatório.'); return; }
    if (existingPortMatch) { toast.error('Posto já cadastrado.'); return; }
    try {
      const { error } = await supabase.from('ports').insert({
        number: newPortNumber,
        description: newPortDescription || null,
        ...(teamId ? { team_id: teamId } : {}),
      });
      if (error) throw error;
      toast.success('Posto adicionado!');
      resetPortForm();
      setMode('list');
      fetchPorts();
    } catch (err: any) {
      toast.error('Erro: ' + err.message);
    }
  };

  const handleSavePort = async () => {
    if (!existingPortMatch) return;
    try {
      const { error } = await supabase.from('ports').update({
        description: newPortDescription || null,
      }).eq('id', existingPortMatch.id);
      if (error) throw error;
      toast.success('Posto atualizado!');
      fetchPorts();
    } catch (err: any) {
      toast.error('Erro: ' + err.message);
    }
  };

  const handleSetPortInactive = async () => {
    if (!existingPortMatch) return;
    const extOnPort = extinguishers.find(e => e.port === existingPortMatch.number);
    if (extOnPort) {
      await supabase.from('extinguishers').update({ status: 'Inativo', port: '' }).eq('id', extOnPort.id);
    }
    const desc = (existingPortMatch.description || '').replace(' [INATIVO]', '');
    await supabase.from('ports').update({ description: desc + ' [INATIVO]' }).eq('id', existingPortMatch.id);
    toast.success('Posto marcado como inativo!');
    fetchPorts();
    onRefresh();
  };

  const handleReactivatePort = async () => {
    if (!existingPortMatch) return;
    const desc = (existingPortMatch.description || '').replace(' [INATIVO]', '');
    await supabase.from('ports').update({ description: desc || null }).eq('id', existingPortMatch.id);
    toast.success('Posto reativado!');
    fetchPorts();
    onRefresh();
  };

  const handleDeletePort = async () => {
    if (!deletePortId) return;
    try {
      const { error } = await supabase.from('ports').delete().eq('id', deletePortId);
      if (error) throw error;
      toast.success('Posto removido!');
      setDeletePortId(null);
      resetPortForm();
      fetchPorts();
    } catch (err: any) {
      toast.error('Erro: ' + err.message);
    }
  };

  const startEdit = (ext: Extinguisher) => {
    setEditId(ext.id);
    setCode(ext.code);
    setPort(ext.port);
    setType(ext.type);
    setWeight(ext.weight);
    const existingPort = ports.find(p => p.number === ext.port);
    setPortDescription(existingPort?.description || '');
    if (ext.warranty_expiry) {
      const parts = ext.warranty_expiry.split('/');
      if (parts.length === 3) setWarrantyExpiry(parts[1] + '/' + parts[2]);
      else setWarrantyExpiry(ext.warranty_expiry);
    } else setWarrantyExpiry('');
    if (ext.third_level) {
      const parts = ext.third_level.split('/');
      if (parts.length === 3) setThirdLevel(parts[2]);
      else setThirdLevel(ext.third_level);
    } else setThirdLevel('');
    setMode('edit');
  };

  const getExpiryStatus = (ext: Extinguisher) => {
    const wDays = daysUntil(ext.warranty_expiry);
    const tDays = daysUntil(ext.third_level);
    const alerts: { type: string; days: number; level: 'urgent' | 'warning' }[] = [];
    if (wDays !== null && wDays <= 30) alerts.push({ type: 'Garantia', days: wDays, level: wDays <= 14 ? 'urgent' : 'warning' });
    if (tDays !== null && tDays <= 30) alerts.push({ type: '3º Nível', days: tDays, level: tDays <= 14 ? 'urgent' : 'warning' });
    return alerts;
  };

  const getNumpadProps = () => {
    if (numpadTarget === 'warrantyExpiry') return { maxDigits: 6, isMonthYear: true, label: 'Vencimento Garantia (MM/AAAA)' };
    if (numpadTarget === 'thirdLevel') return { maxDigits: 4, isYearOnly: true, label: '3º Nível (AAAA)' };
    if (numpadTarget === 'code') return { maxDigits: 3, label: 'Código' };
    if (numpadTarget === 'port') return { maxDigits: 2, label: 'Posto' };
    if (numpadTarget === 'newPort') return { maxDigits: 2, label: 'Número do Posto' };
    return { maxDigits: 4, label: 'Peso' };
  };

  const PortDescriptionBadge = ({ portNumber }: { portNumber: string }) => {
    const desc = getPortDescription(portNumber);
    if (!desc) return null;
    return (
      <Popover>
        <PopoverTrigger asChild>
          <button className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors">
            <MessageSquare className="h-3 w-3" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-60 text-sm">
          <p className="font-bold text-xs mb-1">Posto {portNumber}</p>
          <p className="text-muted-foreground text-xs">{desc || 'Sem descrição'}</p>
        </PopoverContent>
      </Popover>
    );
  };

  const getStatusColor = (status: string) => {
    if (status === 'Em Revisão') return 'text-status-review';
    if (status === 'Reserva') return 'text-status-review';
    if (status === 'Vazio') return 'text-muted-foreground';
    if (status === 'Obstruído') return 'text-status-urgent';
    if (status === 'Inativo') return 'text-muted-foreground';
    return 'text-status-approved';
  };

  const isExistingPortInactive = existingPortMatch?.description?.includes('[INATIVO]') || false;

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => { if (!v) { resetForm(); setMode('list'); } onOpenChange(v); }}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-black">
              {mode === 'list' ? 'Gerenciador de Extintores' : mode === 'numpad' ? 'Numpad' : mode === 'addPort' ? 'Novo Posto' : editId ? 'Editar Extintor' : 'Novo Extintor'}
            </DialogTitle>
          </DialogHeader>

          {mode === 'numpad' && (
            <div>
              <Button variant="ghost" className="mb-2" onClick={() => setMode(numpadTarget === 'newPort' ? 'addPort' : (editId ? 'edit' : 'add'))}>← Voltar</Button>
              <Numpad value={numpadValue} onChange={setNumpadValue} onConfirm={handleNumpadConfirm} {...getNumpadProps()} />
            </div>
          )}

          {mode === 'addPort' && (
            <div className="space-y-3">
              <Button variant="ghost" onClick={() => { resetPortForm(); setMode('list'); }}>← Voltar</Button>
              <div className="cursor-pointer rounded-lg border p-3 hover:bg-muted/50" onClick={() => { setNumpadTarget('newPort'); setNumpadValue(newPortNumber.replace(/\D/g, '')); setMode('numpad'); }}>
                <p className="text-xs text-muted-foreground">Número do Posto</p>
                <p className="text-lg font-bold">{newPortNumber || 'Toque para digitar'}</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">Descrição do Local (opcional)</p>
                <Input value={newPortDescription} onChange={(e) => setNewPortDescription(e.target.value)} className="mt-1" placeholder="Ex: Corredor principal, próximo ao elevador" />
              </div>
              {existingPortMatch ? (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1 h-12 font-bold gap-2" onClick={handleSavePort}>
                      <Save className="h-4 w-4" /> Salvar Mudanças
                    </Button>
                    <Button variant="destructive" className="flex-1 h-12 font-bold gap-2" onClick={() => setDeletePortId(existingPortMatch.id)}>
                      <Trash2 className="h-4 w-4" /> Deletar
                    </Button>
                  </div>
                  {isExistingPortInactive ? (
                    <Button variant="outline" className="w-full h-12 font-bold gap-2 border-status-approved text-status-approved hover:bg-status-approved/10" onClick={handleReactivatePort}>
                      <RotateCcw className="h-4 w-4" /> Reativar Posto
                    </Button>
                  ) : (
                    <Button variant="outline" className="w-full h-12 font-bold gap-2 border-status-urgent text-status-urgent hover:bg-status-urgent/10" onClick={handleSetPortInactive}>
                      <Ban className="h-4 w-4" /> Marcar como Inativo
                    </Button>
                  )}
                </div>
              ) : (
                <Button className="w-full h-12 text-lg font-bold" onClick={handleAddPort}>
                  Adicionar Posto
                </Button>
              )}
            </div>
          )}

          {mode === 'list' && (
            <div className="space-y-3">
              <div className="flex gap-2">
                <Button className="flex-1 gap-2 font-bold" onClick={() => { resetForm(); setMode('add'); }}>
                  <Plus className="h-4 w-4" /> Adicionar Extintor
                </Button>
                <Button variant="outline" className="flex-1 gap-2 font-bold" onClick={() => { resetPortForm(); setMode('addPort'); }}>
                  <MapPin className="h-4 w-4" /> Adicionar Posto
                </Button>
              </div>

              {emptyPorts.length > 0 && (
                <div className="rounded-xl border border-dashed border-muted-foreground/30 p-3 space-y-2">
                  <p className="text-xs font-bold text-muted-foreground">Postos Vazios</p>
                  <div className="flex flex-wrap gap-2">
                    {emptyPorts.map((p) => (
                      <Popover key={p.id}>
                        <PopoverTrigger asChild>
                          <button className="px-3 py-1.5 rounded-lg bg-background text-foreground border border-border text-sm font-bold hover:bg-muted/50 transition-colors flex items-center gap-1.5">
                            <MapPin className="h-3 w-3" />
                            {p.number}
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-60 text-sm">
                          <p className="font-bold text-xs mb-1">Posto {p.number}</p>
                          <p className="text-muted-foreground text-xs">{p.description || 'Sem descrição'}</p>
                        </PopoverContent>
                      </Popover>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                {sortedExtinguishers.map((ext) => {
                  const alerts = getExpiryStatus(ext);
                  const wDays = daysUntil(ext.warranty_expiry);
                  const tDays = daysUntil(ext.third_level);
                  return (
                    <div key={ext.id} className="rounded-xl border p-3 space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {/* Posto is highlighted, extintor code is secondary */}
                          <span className="font-black text-lg">Posto {ext.port || '-'}</span>
                          <PortDescriptionBadge portNumber={ext.port} />
                          <span className="text-muted-foreground text-sm">Ext. {ext.code}</span>
                        </div>
                        <div className="flex gap-1">
                          {ext.status !== 'Em Revisão' && (
                            <Button variant="ghost" size="icon" onClick={() => setReviewId(ext.id)} title="Enviar para revisão">
                              <RefreshCw className="h-4 w-4 text-status-review" />
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" onClick={() => startEdit(ext)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => setDeleteId(ext.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground flex flex-wrap gap-3">
                        <span>{ext.type}</span>
                        <span>{ext.weight}</span>
                        {ext.warranty_expiry && (
                          <span className={wDays !== null && wDays <= 0 ? 'text-status-urgent font-bold' : wDays !== null && wDays <= 30 ? 'text-status-review font-bold' : ''}>
                            Garantia: {displayWarranty(ext.warranty_expiry)}
                          </span>
                        )}
                        {ext.third_level && (
                          <span className={tDays !== null && tDays <= 0 ? 'text-status-urgent font-bold' : tDays !== null && tDays <= 30 ? 'text-status-review font-bold' : ''}>
                            3º Nível: {displayThirdLevel(ext.third_level)}
                          </span>
                        )}
                      </div>
                      <div className={`text-xs font-bold ${getStatusColor(ext.status)}`}>
                        {ext.status}
                      </div>
                      {alerts.map((a, i) => (
                        <div key={i} className={`text-xs font-bold flex items-center gap-1 ${a.level === 'urgent' ? 'text-status-urgent' : 'text-status-review'}`}>
                          <AlertTriangle className="h-3 w-3" /> {a.type}: {a.days} dias
                        </div>
                      ))}
                    </div>
                  );
                })}
                {extinguishers.length === 0 && (
                  <p className="text-center text-sm text-muted-foreground py-8">Nenhum extintor cadastrado</p>
                )}
              </div>
            </div>
          )}

          {(mode === 'add' || mode === 'edit') && (
            <div className="space-y-3">
              <Button variant="ghost" onClick={() => { resetForm(); setMode('list'); }}>← Voltar</Button>
              <div className="cursor-pointer rounded-lg border p-3 hover:bg-muted/50" onClick={() => openNumpad('code', code)}>
                <p className="text-xs text-muted-foreground">Código</p>
                <p className="text-lg font-bold">{code || 'Toque para digitar'}</p>
              </div>
              <div className="cursor-pointer rounded-lg border p-3 hover:bg-muted/50" onClick={() => openNumpad('port', port)}>
                <p className="text-xs text-muted-foreground">Posto</p>
                <p className="text-lg font-bold">{port || 'Toque para digitar'}</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">Descrição do Posto (opcional)</p>
                <Input value={portDescription} onChange={(e) => setPortDescription(e.target.value)} className="mt-1" placeholder="Ex: Corredor principal" />
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">Tipo</p>
                <Input value={type} onChange={(e) => setType(e.target.value)} className="mt-1" />
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">Peso</p>
                <Input value={weight} onChange={(e) => setWeight(e.target.value)} className="mt-1" />
              </div>
              <div className="cursor-pointer rounded-lg border p-3 hover:bg-muted/50" onClick={() => openNumpad('warrantyExpiry', warrantyExpiry)}>
                <p className="text-xs text-muted-foreground">Vencimento Garantia (MM/AAAA)</p>
                <p className="text-lg font-bold">{warrantyExpiry || 'Não informado'}</p>
              </div>
              <div className="cursor-pointer rounded-lg border p-3 hover:bg-muted/50" onClick={() => openNumpad('thirdLevel', thirdLevel)}>
                <p className="text-xs text-muted-foreground">3º Nível (AAAA)</p>
                <p className="text-lg font-bold">{thirdLevel || 'Não informado'}</p>
              </div>
              <Button className="w-full h-12 text-lg font-bold" onClick={handleSave} disabled={saving}>
                {saving ? 'Salvando...' : editId ? 'Salvar Alterações' : 'Adicionar Extintor'}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete extinguisher - 2s delay */}
      <DelayedConfirmDialog
        open={!!deleteId}
        onOpenChange={(v) => { if (!v) setDeleteId(null); }}
        title="Excluir extintor?"
        description="Esta ação não pode ser desfeita. O extintor e seu histórico serão removidos."
        onConfirm={handleDelete}
        delaySeconds={2}
        confirmLabel="Excluir"
        destructive
      />

      {/* Delete port - 2s delay */}
      <DelayedConfirmDialog
        open={!!deletePortId}
        onOpenChange={(v) => { if (!v) setDeletePortId(null); }}
        title="Excluir posto?"
        description="Esta ação não pode ser desfeita."
        onConfirm={handleDeletePort}
        delaySeconds={2}
        confirmLabel="Excluir"
        destructive
      />

      {/* Send to review - 2s delay with reason selector */}
      <DelayedConfirmDialog
        open={!!reviewId}
        onOpenChange={(v) => { if (!v) { setReviewId(null); setReviewReason('Utilizado'); setReviewDescription(''); } }}
        title="Enviar para revisão?"
        description="Selecione o motivo para envio."
        onConfirm={handleSendToReview}
        delaySeconds={2}
        confirmLabel="Enviar para Revisão"
      >
        <div className="space-y-3 py-2">
          <div>
            <p className="text-xs font-bold text-muted-foreground mb-2">Motivo</p>
            <div className="flex gap-2">
              {['Utilizado', 'Vencimento', 'Outro'].map((reason) => (
                <Button
                  key={reason}
                  variant={reviewReason === reason ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setReviewReason(reason)}
                  className="flex-1"
                >
                  {reason}
                </Button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Descrição {reviewReason === 'Outro' ? '(obrigatória)' : '(opcional)'}</p>
            <Input
              placeholder="Descreva o motivo..."
              value={reviewDescription}
              onChange={(e) => setReviewDescription(e.target.value)}
            />
          </div>
        </div>
      </DelayedConfirmDialog>
    </>
  );
};

export default ExtinguisherManager;
