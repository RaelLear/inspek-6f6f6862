import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Inspection, Extinguisher } from '@/lib/types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Info } from 'lucide-react';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  inspections: Inspection[];
  extinguishers: Extinguisher[];
}

const MONTHS_SHORT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

const MetricsDialog = ({ open, onOpenChange, inspections }: Props) => {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(String(currentYear));

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
      // Only count manometer and seal non-conformities
      const reviews = monthInsps.filter(
        (insp) => insp.manometer_status === 'Não Conforme' || insp.seal_status === 'Não Conforme'
      ).length;
      return { name, inspeções: monthInsps.length, revisões: reviews };
    });
  }, [inspections, selectedYear]);

  return (
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

          {/* Disclaimer */}
          <div className="rounded-lg border p-3 bg-muted/30 flex items-start gap-2">
            <Info className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
            <p className="text-xs text-muted-foreground">
              Somente não conformidades de <strong>Manômetro</strong> e <strong>Lacre</strong> são contabilizadas como revisões. 
              Vencimento de <strong>Garantia</strong> e <strong>3º Nível</strong> são considerados revisão periódica obrigatória 
              e não entram como métrica de comparação.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MetricsDialog;
