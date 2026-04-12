import { useState, useMemo, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Inspection, displayWarranty, displayThirdLevel } from '@/lib/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Printer, Check, X, Trash2, Minus } from 'lucide-react';
import DelayedConfirmDialog from './DelayedConfirmDialog';
import { useNavigate } from 'react-router-dom';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  inspections: Inspection[];
  onRefresh: () => void;
}

const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

type ConformityFilter = 'all' | 'conforme' | 'nao_conforme';
type SubcategoryFilter = 'all' | 'manometer' | 'seal' | 'plate' | 'floorPaint';

const SpreadsheetDialog = ({ open, onOpenChange, inspections, onRefresh }: Props) => {
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(String(now.getMonth()));
  const [selectedYear, setSelectedYear] = useState(String(now.getFullYear()));
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [conformityFilter, setConformityFilter] = useState<ConformityFilter>('all');
  const [subcategoryFilter, setSubcategoryFilter] = useState<SubcategoryFilter>('all');
  const [warrantyMonthFilter, setWarrantyMonthFilter] = useState<string>('all');
  const [warrantyYearFilter, setWarrantyYearFilter] = useState<string>('all');
  const [thirdLevelYearFilter, setThirdLevelYearFilter] = useState<string>('all');
  const [ports, setPorts] = useState<{ id: string; number: string; description: string | null }[]>([]);
  const [showPrintPopup, setShowPrintPopup] = useState(false);
  const navigate = useNavigate();

  const fetchPorts = useCallback(async () => {
    const { data } = await supabase.from('ports').select('*');
    if (data) setPorts(data as any);
  }, []);

  useEffect(() => {
    if (open) fetchPorts();
  }, [open, fetchPorts]);

  const getPortDescription = (portNumber: string) => {
    const p = ports.find(pt => pt.number === portNumber);
    return p?.description || null;
  };

  const inactivePorts = useMemo(() => {
    return ports.filter(p => p.description?.includes('[INATIVO]')).sort((a, b) => (parseInt(a.number) || 0) - (parseInt(b.number) || 0));
  }, [ports]);

  const filtered = useMemo(() => {
    let result = inspections.filter((insp) => {
      const parts = insp.inspection_date.split('/');
      if (parts.length !== 3) return false;
      const month = parseInt(parts[1]) - 1;
      const year = parseInt(parts[2]);
      return month === parseInt(selectedMonth) && year === parseInt(selectedYear);
    });

    if (conformityFilter !== 'all') {
      const isConforme = conformityFilter === 'conforme';
      result = result.filter((insp) => {
        if (subcategoryFilter === 'all') {
          const statuses = [insp.manometer_status, insp.seal_status, insp.plate_status, insp.floor_paint_status];
          return isConforme ? statuses.every(s => s === 'Conforme') : statuses.some(s => s === 'Não Conforme');
        }
        const statusMap: Record<string, string> = {
          manometer: insp.manometer_status, seal: insp.seal_status, plate: insp.plate_status, floorPaint: insp.floor_paint_status,
        };
        const status = statusMap[subcategoryFilter];
        return isConforme ? status === 'Conforme' : status === 'Não Conforme';
      });
    }

    if (warrantyMonthFilter !== 'all' || warrantyYearFilter !== 'all') {
      result = result.filter((insp) => {
        if (!insp.warranty_expiry) return false;
        const parts = insp.warranty_expiry.split('/');
        if (parts.length !== 3) return false;
        if (warrantyMonthFilter !== 'all' && parts[1] !== warrantyMonthFilter.padStart(2, '0')) return false;
        if (warrantyYearFilter !== 'all' && parts[2] !== warrantyYearFilter) return false;
        return true;
      });
    }

    if (thirdLevelYearFilter !== 'all') {
      result = result.filter((insp) => {
        if (!insp.third_level) return false;
        const parts = insp.third_level.split('/');
        if (parts.length !== 3) return false;
        return parts[2] === thirdLevelYearFilter;
      });
    }

    return result.sort((a, b) => parseInt(a.port) - parseInt(b.port));
  }, [inspections, selectedMonth, selectedYear, conformityFilter, subcategoryFilter, warrantyMonthFilter, warrantyYearFilter, thirdLevelYearFilter]);

  const years = useMemo(() => {
    const yrs = new Set<string>();
    inspections.forEach((i) => {
      const parts = i.inspection_date.split('/');
      if (parts.length === 3) yrs.add(parts[2]);
    });
    yrs.add(String(now.getFullYear()));
    return Array.from(yrs).sort();
  }, [inspections]);

  const warrantyYears = useMemo(() => {
    const yrs = new Set<string>();
    inspections.forEach((i) => {
      if (i.warranty_expiry) {
        const parts = i.warranty_expiry.split('/');
        if (parts.length === 3) yrs.add(parts[2]);
      }
    });
    return Array.from(yrs).sort();
  }, [inspections]);

  const thirdLevelYears = useMemo(() => {
    const yrs = new Set<string>();
    inspections.forEach((i) => {
      if (i.third_level) {
        const parts = i.third_level.split('/');
        if (parts.length === 3) yrs.add(parts[2]);
      }
    });
    return Array.from(yrs).sort();
  }, [inspections]);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const { error } = await supabase.from('inspections').delete().eq('id', deleteId);
      if (error) throw error;
      toast.success('Registro excluído!');
      setDeleteId(null);
      onRefresh();
    } catch (err: any) {
      toast.error('Erro: ' + err.message);
    }
  };

  const handlePrintClick = () => {
    setShowPrintPopup(true);
  };

  const handlePrintConfirm = () => {
    setShowPrintPopup(false);
    // Pass all active filters to print page
    const params = new URLSearchParams({
      month: selectedMonth,
      year: selectedYear,
    });
    if (conformityFilter !== 'all') params.set('conformity', conformityFilter);
    if (subcategoryFilter !== 'all') params.set('subcategory', subcategoryFilter);
    if (warrantyMonthFilter !== 'all') params.set('warrantyMonth', warrantyMonthFilter);
    if (warrantyYearFilter !== 'all') params.set('warrantyYear', warrantyYearFilter);
    if (thirdLevelYearFilter !== 'all') params.set('thirdLevelYear', thirdLevelYearFilter);
    navigate(`/print?${params.toString()}`);
    onOpenChange(false);
  };

  const StatusIcon = ({ status }: { status: string }) => {
    if (status === '-') return <Minus className="h-4 w-4 text-muted-foreground mx-auto" />;
    return status === 'Conforme'
      ? <Check className="h-4 w-4 text-status-approved mx-auto" />
      : <X className="h-4 w-4 text-status-urgent mx-auto" />;
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-black">Planilha Geral</DialogTitle>
          </DialogHeader>

          <div className="flex flex-wrap items-center gap-3 mb-2">
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                {MONTHS.map((m, i) => <SelectItem key={i} value={String(i)}>{m}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
              <SelectContent>
                {years.map((y) => <SelectItem key={y} value={y}>{y}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button variant="outline" className="gap-2 font-bold ml-auto" onClick={handlePrintClick}>
              <Printer className="h-4 w-4" /> Imprimir
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-2 mb-4">
            <Select value={conformityFilter} onValueChange={(v) => setConformityFilter(v as ConformityFilter)}>
              <SelectTrigger className="w-36"><SelectValue placeholder="Conformidade" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="conforme">Conforme</SelectItem>
                <SelectItem value="nao_conforme">Não Conforme</SelectItem>
              </SelectContent>
            </Select>
            {conformityFilter !== 'all' && (
              <Select value={subcategoryFilter} onValueChange={(v) => setSubcategoryFilter(v as SubcategoryFilter)}>
                <SelectTrigger className="w-36"><SelectValue placeholder="Subcategoria" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="manometer">Manômetro</SelectItem>
                  <SelectItem value="seal">Lacre</SelectItem>
                  <SelectItem value="plate">Placa</SelectItem>
                  <SelectItem value="floorPaint">Pintura Piso</SelectItem>
                </SelectContent>
              </Select>
            )}
            <Select value={warrantyMonthFilter} onValueChange={setWarrantyMonthFilter}>
              <SelectTrigger className="w-32"><SelectValue placeholder="Garantia Mês" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Garantia Mês</SelectItem>
                {MONTHS.map((m, i) => <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={warrantyYearFilter} onValueChange={setWarrantyYearFilter}>
              <SelectTrigger className="w-28"><SelectValue placeholder="Garantia Ano" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Garantia Ano</SelectItem>
                {warrantyYears.map((y) => <SelectItem key={y} value={y}>{y}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={thirdLevelYearFilter} onValueChange={setThirdLevelYearFilter}>
              <SelectTrigger className="w-28"><SelectValue placeholder="3º Nível" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">3º Nível Ano</SelectItem>
                {thirdLevelYears.map((y) => <SelectItem key={y} value={y}>{y}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b-2 border-foreground/20">
                  <th className="p-2 text-left font-bold">Código</th>
                  <th className="p-2 text-left font-bold">Posto</th>
                  <th className="p-2 text-left font-bold">Data</th>
                  <th className="p-2 text-center font-bold">Manômetro</th>
                  <th className="p-2 text-center font-bold">Lacre</th>
                  <th className="p-2 text-center font-bold">Placa</th>
                  <th className="p-2 text-center font-bold">Piso</th>
                  <th className="p-2 text-left font-bold">Garantia</th>
                  <th className="p-2 text-left font-bold">3º Nível</th>
                  <th className="p-2 text-center font-bold">Ações</th>
                </tr>
              </thead>
              <tbody>
                {inactivePorts.map((p) => (
                  <tr key={`inactive-${p.id}`} className="border-b border-border bg-muted/30">
                    <td className="p-2 font-bold text-muted-foreground" colSpan={2}>
                      Posto {p.number}
                    </td>
                    <td className="p-2 text-muted-foreground font-bold" colSpan={7}>INATIVO</td>
                    <td className="p-2"></td>
                  </tr>
                ))}
                {filtered.length === 0 && inactivePorts.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="text-center text-muted-foreground py-8">Nenhuma inspeção encontrada</td>
                  </tr>
                ) : (
                  filtered.map((insp) => (
                    <tr key={insp.id} className="border-b border-border hover:bg-muted/30">
                      <td className="p-2 font-bold">{insp.code}</td>
                      <td className="p-2">
                        <Popover>
                          <PopoverTrigger asChild>
                            <button className="hover:underline font-medium cursor-pointer">{insp.port}</button>
                          </PopoverTrigger>
                          <PopoverContent className="w-60 text-sm">
                            <p className="font-bold text-xs mb-1">Posto {insp.port}</p>
                            <p className="text-muted-foreground text-xs">{getPortDescription(insp.port) || 'Sem descrição'}</p>
                          </PopoverContent>
                        </Popover>
                      </td>
                      <td className="p-2">{insp.inspection_date}</td>
                      <td className="p-2 text-center"><StatusIcon status={insp.manometer_status} /></td>
                      <td className="p-2 text-center"><StatusIcon status={insp.seal_status} /></td>
                      <td className="p-2 text-center"><StatusIcon status={insp.plate_status} /></td>
                      <td className="p-2 text-center"><StatusIcon status={insp.floor_paint_status} /></td>
                      <td className="p-2 text-xs">{displayWarranty(insp.warranty_expiry)}</td>
                      <td className="p-2 text-xs">{displayThirdLevel(insp.third_level)}</td>
                      <td className="p-2 text-center">
                        <Button variant="ghost" size="icon" onClick={() => setDeleteId(insp.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </DialogContent>
      </Dialog>

      {/* Print popup */}
      <Dialog open={showPrintPopup} onOpenChange={setShowPrintPopup}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-center">Imprimir Relatório</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-lg border p-4 bg-muted/30">
              <p className="text-sm text-center text-muted-foreground">
                Recomendamos selecionar a opção <strong>"Salvar como PDF"</strong> na tela de impressão para melhor qualidade do documento.
              </p>
            </div>
            <div className="flex justify-center">
              <Button className="h-12 px-8 text-lg font-bold gap-2" onClick={handlePrintConfirm}>
                <Printer className="h-5 w-5" /> Imprimir
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete inspection - 2s delay */}
      <DelayedConfirmDialog
        open={!!deleteId}
        onOpenChange={(v) => { if (!v) setDeleteId(null); }}
        title="Excluir registro?"
        description="Esta inspeção será removida permanentemente."
        onConfirm={handleDelete}
        delaySeconds={2}
        confirmLabel="Excluir"
        destructive
      />
    </>
  );
};

export default SpreadsheetDialog;
