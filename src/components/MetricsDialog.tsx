import { useState, useMemo, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Inspection, Extinguisher } from '@/lib/types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Info, Pencil } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { toast } from 'sonner';
import DelayedConfirmDialog from './DelayedConfirmDialog';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  inspections: Inspection[];
  extinguishers: Extinguisher[];
}

const MONTHS_SHORT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

interface ReviewCount {
  id?: string;
  month: number;
  year: number;
  count: number;
}

const MetricsDialog = ({ open, onOpenChange, inspections }: Props) => {
  const { user } = useAuth();
  const { currentTeamId } = useWorkspace();
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(String(currentYear));
  const [reviewCounts, setReviewCounts] = useState<ReviewCount[]>([]);
  const [editMonth, setEditMonth] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');
  const [showEditConfirm, setShowEditConfirm] = useState(false);

  const fetchReviewCounts = useCallback(async () => {
    if (!user) return;
    let query = (supabase.from as any)('monthly_review_counts')
      .select('*')
      .eq('year', parseInt(selectedYear));
    if (currentTeamId) {
      query = query.eq('team_id', currentTeamId);
    } else {
      query = query.is('team_id', null);
    }
    const { data } = await query;
    setReviewCounts((data || []) as ReviewCount[]);
  }, [user, selectedYear, currentTeamId]);

  useEffect(() => {
    if (open) fetchReviewCounts();
  }, [open, fetchReviewCounts]);

  const years = useMemo(() => {
    const yrs = new Set<string>();
    inspections.forEach((i) => {
      const parts = i.inspection_date.split('/');
      if (parts.length === 3) yrs.add(parts[2]);
    });
    yrs.add(String(currentYear));
    return Array.from(yrs).sort();
  }, [inspections]);

  const monthlyData = useMemo(() => {
    return MONTHS_SHORT.map((name, i) => {
      const monthInsps = inspections.filter((insp) => {
        const parts = insp.inspection_date.split('/');
        if (parts.length !== 3) return false;
        return parseInt(parts[1]) - 1 === i && parts[2] === selectedYear;
      });
      const rc = reviewCounts.find(r => r.month === i + 1 && r.year === parseInt(selectedYear));
      return { name, inspeções: monthInsps.length, revisões: rc?.count || 0, monthIndex: i };
    });
  }, [inspections, selectedYear, reviewCounts]);

  const handleStartEdit = (monthIndex: number) => {
    const rc = reviewCounts.find(r => r.month === monthIndex + 1 && r.year === parseInt(selectedYear));
    setEditMonth(monthIndex);
    setEditValue(String(rc?.count || 0));
  };

  const handleConfirmEdit = async () => {
    if (editMonth === null || !user) return;
    const newCount = parseInt(editValue) || 0;
    const month = editMonth + 1;
    const year = parseInt(selectedYear);

    try {
      const existing = reviewCounts.find(r => r.month === month && r.year === year);
      if (existing?.id) {
        await (supabase.from as any)('monthly_review_counts')
          .update({ count: newCount, updated_at: new Date().toISOString() })
          .eq('id', existing.id);
      } else {
        await (supabase.from as any)('monthly_review_counts')
          .insert({
            month, year, count: newCount,
            ...(currentTeamId ? { team_id: currentTeamId } : {}),
          });
      }
      toast.success('Revisões atualizadas!');
      setShowEditConfirm(false);
      setEditMonth(null);
      fetchReviewCounts();
    } catch (err: any) {
      toast.error('Erro: ' + err.message);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-black">Métricas</DialogTitle>
          </DialogHeader>

          <div className="flex gap-3 mb-4">
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
              <SelectContent>
                {years.map((y) => <SelectItem key={y} value={y}>{y}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-bold mb-3">Inspeções vs Revisões Mensais</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="inspeções" fill="hsl(0, 0%, 15%)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="revisões" fill="hsl(0, 72%, 51%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Editable review counts */}
            <div>
              <h3 className="text-sm font-bold mb-3">Revisões por Mês</h3>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {monthlyData.map((d) => (
                  <div key={d.monthIndex} className="rounded-lg border p-2 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">{d.name}</p>
                      <p className="font-bold text-sm">{d.revisões}</p>
                    </div>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleStartEdit(d.monthIndex)}>
                      <Pencil className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Disclaimer */}
            <div className="rounded-lg border p-3 bg-muted/30 flex items-start gap-2">
              <Info className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <p className="text-xs text-muted-foreground">
                As revisões representam a quantidade de extintores enviados para revisão no mês.
                Este número é fixo e não é afetado ao confirmar o recebimento dos extintores.
                Utilize o botão de editar para corrigir a contagem se necessário. Revisões antigas podem ser perdidas nas métricas.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <DelayedConfirmDialog
        open={showEditConfirm}
        onOpenChange={(v) => { if (!v) { setShowEditConfirm(false); setEditMonth(null); } }}
        title="Corrigir revisões?"
        description={editMonth !== null ? `Alterar a quantidade de revisões de ${MONTHS_SHORT[editMonth]}/${selectedYear} para ${editValue}.` : ''}
        onConfirm={handleConfirmEdit}
        delaySeconds={5}
        confirmLabel="Confirmar"
      />

      {/* Edit value input dialog */}
      {editMonth !== null && !showEditConfirm && (
        <Dialog open={true} onOpenChange={() => setEditMonth(null)}>
          <DialogContent className="max-w-xs">
            <DialogHeader>
              <DialogTitle className="text-lg font-black">
                Revisões - {MONTHS_SHORT[editMonth]}/{selectedYear}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <Input
                type="number"
                min="0"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="text-center text-lg font-bold"
              />
              <Button className="w-full font-bold" onClick={() => setShowEditConfirm(true)}>
                Salvar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

export default MetricsDialog;
