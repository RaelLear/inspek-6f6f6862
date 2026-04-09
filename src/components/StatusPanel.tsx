import { Extinguisher } from '@/lib/types';
import { CheckCircle, AlertTriangle, Ban } from 'lucide-react';

interface StatusPanelProps {
  extinguishers: Extinguisher[];
  onStatusClick?: (filter: string) => void;
}

const ExtinguisherIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="8" y="6" width="8" height="14" rx="1.5" />
    <path d="M10 6V4h4v2" />
    <path d="M12 4V2" />
    <path d="M14 2h-4" />
    <path d="M10 20h4v1h-4z" />
    <path d="M15 8h1.5a1 1 0 0 1 1 1v1" />
  </svg>
);

const StatusPanel = ({ extinguishers, onStatusClick }: StatusPanelProps) => {
  const total = extinguishers.length;
  const inReview = extinguishers.filter((e) => e.status === 'Em Revisão').length;
  const obstructed = extinguishers.filter((e) => e.status === 'Obstruído').length;
  const reserve = extinguishers.filter((e) => e.status === 'Reserva').length;
  const inactive = extinguishers.filter((e) => e.status === 'Inativo' || e.status === 'Vazio').length;
  const approved = total - inReview - obstructed - reserve - inactive;

  const Card = ({ children, filter }: { children: React.ReactNode; filter: string }) => (
    <button
      className="flex flex-col items-center gap-1 rounded-xl border bg-card p-4 transition-all hover:bg-muted/50 active:scale-95"
      onClick={() => onStatusClick?.(filter)}
    >
      {children}
    </button>
  );

  return (
    <div className="grid grid-cols-4 gap-3">
      <Card filter="Total">
        <ExtinguisherIcon className="h-6 w-6 text-foreground" />
        <span className="text-2xl font-black">{total}</span>
        <span className="text-xs font-medium text-muted-foreground">Total</span>
      </Card>
      <Card filter="Aprovados">
        <CheckCircle className="h-6 w-6 text-status-approved" />
        <span className="text-2xl font-black text-status-approved">{approved}</span>
        <span className="text-xs font-medium text-muted-foreground">Aprovados</span>
      </Card>
      <Card filter="Em Revisão">
        <AlertTriangle className="h-6 w-6 text-status-review" />
        <span className="text-2xl font-black text-status-review">{inReview}</span>
        <span className="text-xs font-medium text-muted-foreground">Em Revisão</span>
      </Card>
      <Card filter="Obstruídos">
        <Ban className="h-6 w-6 text-status-urgent" />
        <span className="text-2xl font-black text-status-urgent">{obstructed}</span>
        <span className="text-xs font-medium text-muted-foreground">Obstruídos</span>
      </Card>
    </div>
  );
};

export default StatusPanel;
