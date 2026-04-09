import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { GripVertical, RotateCcw } from 'lucide-react';

export interface InspectionField {
  id: string;
  label: string;
  required: boolean;
  enabled: boolean;
  order: number;
}

const DEFAULT_FIELDS: InspectionField[] = [
  { id: 'code', label: 'Código', required: true, enabled: true, order: 0 },
  { id: 'port', label: 'Ponto', required: true, enabled: true, order: 1 },
  { id: 'manometer', label: 'Manômetro', required: true, enabled: true, order: 2 },
  { id: 'seal', label: 'Lacre', required: true, enabled: true, order: 3 },
  { id: 'plate', label: 'Placa', required: true, enabled: true, order: 4 },
  { id: 'floorPaint', label: 'Pintura do Piso', required: true, enabled: true, order: 5 },
  { id: 'inspectionDate', label: 'Data da Inspeção', required: true, enabled: true, order: 6 },
  { id: 'warrantyExpiry', label: 'Vencimento Garantia', required: true, enabled: true, order: 7 },
  { id: 'thirdLevel', label: '3º Nível', required: true, enabled: true, order: 8 },
];

const CACHE_KEY = 'inspek-inspection-fields';

export const loadInspectionFields = (): InspectionField[] => {
  try {
    const saved = localStorage.getItem(CACHE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as InspectionField[];
      // Merge with defaults for any new fields
      const ids = new Set(parsed.map(f => f.id));
      const merged = [...parsed];
      DEFAULT_FIELDS.forEach(d => {
        if (!ids.has(d.id)) merged.push(d);
      });
      return merged.sort((a, b) => a.order - b.order);
    }
  } catch { /* ignore */ }
  return DEFAULT_FIELDS;
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const InspectionFieldsEditor = ({ open, onOpenChange }: Props) => {
  const [fields, setFields] = useState<InspectionField[]>(loadInspectionFields);

  useEffect(() => {
    if (open) setFields(loadInspectionFields());
  }, [open]);

  const save = () => {
    localStorage.setItem(CACHE_KEY, JSON.stringify(fields));
    onOpenChange(false);
  };

  const reset = () => {
    setFields(DEFAULT_FIELDS);
    localStorage.removeItem(CACHE_KEY);
  };

  const toggleEnabled = (id: string) => {
    setFields(prev => prev.map(f => f.id === id ? { ...f, enabled: !f.enabled } : f));
  };

  const toggleRequired = (id: string) => {
    setFields(prev => prev.map(f => f.id === id ? { ...f, required: !f.required } : f));
  };

  const moveField = (from: number, to: number) => {
    if (to < 0 || to >= fields.length) return;
    const updated = [...fields];
    const [moved] = updated.splice(from, 1);
    updated.splice(to, 0, moved);
    setFields(updated.map((f, i) => ({ ...f, order: i })));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-black">Editar Processo de Inspeção</DialogTitle>
        </DialogHeader>

        <p className="text-xs text-muted-foreground">
          Configure quais campos aparecerão na inspeção, a ordem e se são obrigatórios.
        </p>

        <div className="space-y-2 mt-2">
          {fields.map((field, idx) => (
            <div
              key={field.id}
              className={`flex items-center gap-3 rounded-xl border p-3 transition-all ${
                field.enabled ? 'bg-card' : 'bg-muted/50 opacity-60'
              }`}
            >
              {/* Reorder arrows */}
              <div className="flex flex-col gap-0.5">
                <button
                  onClick={() => moveField(idx, idx - 1)}
                  className="rounded p-0.5 hover:bg-muted text-muted-foreground text-xs"
                  disabled={idx === 0}
                >▲</button>
                <button
                  onClick={() => moveField(idx, idx + 1)}
                  className="rounded p-0.5 hover:bg-muted text-muted-foreground text-xs"
                  disabled={idx === fields.length - 1}
                >▼</button>
              </div>

              {/* Field info */}
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">{field.label}</p>
                {field.enabled && (
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-muted-foreground">Obrigatório</span>
                    <Switch
                      checked={field.required}
                      onCheckedChange={() => toggleRequired(field.id)}
                      className="scale-75 origin-left"
                    />
                  </div>
                )}
              </div>

              {/* Enable toggle */}
              <Switch
                checked={field.enabled}
                onCheckedChange={() => toggleEnabled(field.id)}
              />
            </div>
          ))}
        </div>

        <div className="flex gap-2 mt-4">
          <Button variant="outline" size="sm" className="gap-1" onClick={reset}>
            <RotateCcw className="h-3.5 w-3.5" /> Restaurar padrão
          </Button>
          <Button size="sm" className="flex-1 font-bold" onClick={save}>
            Salvar configuração
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InspectionFieldsEditor;
