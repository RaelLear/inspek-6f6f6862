import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Extinguisher, displayWarranty, displayThirdLevel } from '@/lib/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { CheckCircle, PackageCheck } from 'lucide-react';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  extinguishers: Extinguisher[];
  filter: string;
  onRefresh?: () => void;
}

const StatusDetailDialog = ({ open, onOpenChange, extinguishers, filter, onRefresh }: Props) => {
  const [approveId, setApproveId] = useState<string | null>(null);
  const [confirmAllReview, setConfirmAllReview] = useState(false);

  const filtered = filter === 'Total'
    ? extinguishers
    : filter === 'Aprovados'
    ? extinguishers.filter(e => e.status === 'Aprovado')
    : filter === 'Em Revisão'
    ? extinguishers.filter(e => e.status === 'Em Revisão')
    : filter === 'Obstruídos'
    ? extinguishers.filter(e => e.status === 'Obstruído')
    : extinguishers;

  const sorted = [...filtered].sort((a, b) => {
    const aPort = parseInt(a.port) || 0;
    const bPort = parseInt(b.port) || 0;
    return aPort - bPort;
  });

  const getStatusColor = (status: string) => {
    if (status === 'Em Revisão') return 'text-status-review';
    if (status === 'Reserva') return 'text-status-review';
    if (status === 'Obstruído') return 'text-status-urgent';
    if (status === 'Inativo' || status === 'Vazio') return 'text-muted-foreground';
    return 'text-status-approved';
  };

  const handleApproveObstructed = async () => {
    if (!approveId) return;
    try {
      const { error } = await supabase.from('extinguishers').update({
        status: 'Aprovado',
        review_send_date: null,
      }).eq('id', approveId);
      if (error) throw error;
      toast.success('Extintor aprovado!');
      setApproveId(null);
      onRefresh?.();
    } catch (err: any) {
      toast.error('Erro: ' + err.message);
    }
  };

  const handleConfirmAllReviewArrival = async () => {
    try {
      const reviewItems = extinguishers.filter(e => e.status === 'Em Revisão');
      for (const ext of reviewItems) {
        // Delete the extinguisher - new ones will be added to replace them
        await supabase.from('extinguishers').delete().eq('id', ext.id);
      }
      toast.success(`${reviewItems.length} extintor(es) removidos. Adicione os novos extintores no gerenciador.`);
      setConfirmAllReview(false);
      onRefresh?.();
    } catch (err: any) {
      toast.error('Erro: ' + err.message);
    }
  };

  const reviewCount = extinguishers.filter(e => e.status === 'Em Revisão').length;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-black">{filter} ({sorted.length})</DialogTitle>
          </DialogHeader>

          {filter === 'Em Revisão' && reviewCount > 0 && (
            <Button
              className="w-full h-12 gap-2 font-bold bg-foreground text-background hover:bg-foreground/90"
              onClick={() => setConfirmAllReview(true)}
            >
              <PackageCheck className="h-5 w-5" />
              Confirmar chegada dos novos extintores ({reviewCount})
            </Button>
          )}

          {sorted.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Nenhum extintor</p>
          ) : (
            <div className="space-y-2">
              {sorted.map(ext => (
                <div key={ext.id} className="rounded-xl border p-3 space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-lg">{ext.code}</span>
                      <span className="text-muted-foreground text-sm">Posto: {ext.port || '-'}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className={`text-xs font-bold ${getStatusColor(ext.status)}`}>{ext.status}</span>
                      {filter === 'Obstruídos' && (
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setApproveId(ext.id)}>
                          <CheckCircle className="h-4 w-4 text-status-approved" />
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground flex flex-wrap gap-3">
                    <span>{ext.type}</span>
                    <span>{ext.weight}</span>
                    {ext.warranty_expiry && ext.warranty_expiry !== '--' && <span>Garantia: {displayWarranty(ext.warranty_expiry)}</span>}
                    {ext.third_level && ext.third_level !== '--' && <span>3º Nível: {displayThirdLevel(ext.third_level)}</span>}
                  </div>
                  {ext.review_send_date && (
                    <div className="text-xs text-status-review font-medium">Enviado para revisão: {ext.review_send_date}</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!approveId} onOpenChange={(v) => { if (!v) setApproveId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Aprovar extintor?</AlertDialogTitle>
            <AlertDialogDescription>O extintor será marcado como aprovado.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleApproveObstructed}>Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmAllReview} onOpenChange={setConfirmAllReview}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar chegada dos novos extintores?</AlertDialogTitle>
            <AlertDialogDescription>
              Os {reviewCount} extintores em revisão serão removidos. Adicione os novos extintores pelo gerenciador nos postos correspondentes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmAllReviewArrival}>Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default StatusDetailDialog;
