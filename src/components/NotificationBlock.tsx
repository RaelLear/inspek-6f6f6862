import { Extinguisher, daysUntil } from '@/lib/types';
import { AlertTriangle, Clock } from 'lucide-react';

interface NotificationBlockProps {
  extinguishers: Extinguisher[];
}

interface ExpiryItem {
  ext: Extinguisher;
  days: number;
  type: string;
}

const NotificationBlock = ({ extinguishers }: NotificationBlockProps) => {
  const items: ExpiryItem[] = [];

  extinguishers.forEach((ext) => {
    const wDays = daysUntil(ext.warranty_expiry);
    if (wDays !== null) {
      items.push({ ext, days: wDays, type: 'Vencimento Garantia' });
    }
    const tDays = daysUntil(ext.third_level);
    if (tDays !== null) {
      items.push({ ext, days: tDays, type: '3º Nível' });
    }
  });

  items.sort((a, b) => a.days - b.days);

  const urgent = items.filter((i) => i.days <= 30);
  const display = urgent.length > 0 ? urgent : items.slice(0, 5);

  if (display.length === 0) {
    return (
      <div className="rounded-xl border bg-card p-4 text-center text-sm text-muted-foreground">
        <Clock className="h-5 w-5 mx-auto mb-1" />
        Nenhum vencimento próximo
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-card p-4 space-y-2">
      <h3 className="text-sm font-bold flex items-center gap-2">
        <AlertTriangle className="h-4 w-4" /> Notificações
      </h3>
      <div className="space-y-1">
        {display.map((item, i) => {
          const isUrgent = item.days <= 14;
          const isWarning = item.days > 14 && item.days <= 30;
          return (
            <div
              key={i}
              className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium ${
                isUrgent
                  ? 'bg-status-urgent/10 text-status-urgent'
                  : isWarning
                  ? 'bg-status-review/10 text-status-review'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              <span>
                Ext. {item.ext.code} (Ponto {item.ext.port || '-'}) - {item.type}
              </span>
              <span className="font-bold">{item.days} dias</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default NotificationBlock;
