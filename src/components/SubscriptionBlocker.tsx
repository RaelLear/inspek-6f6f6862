import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ExternalLink, AlertCircle } from 'lucide-react';

const CHECKOUT_URL = 'https://ggcheckout.com.br/checkout/v3/TiAVZAEamTV4bjD6gfcU';

interface Subscription {
  status: string;
  trial_ends_at: string;
  permanent: boolean;
}

export const useSubscription = () => {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    const fetchSub = async () => {
      const { data } = await (supabase.from as any)('subscriptions').select('*').eq('user_id', user.id).single();
      setSubscription(data as Subscription | null);
      setLoading(false);
    };
    fetchSub();
  }, [user]);

  const getTrialDaysLeft = (): number | null => {
    if (!subscription) return null;
    if (subscription.status !== 'trial') return null;
    const trialEnd = new Date(subscription.trial_ends_at);
    const now = new Date();
    const diff = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
  };

  const isActive = (): boolean => {
    if (!subscription) return true; // grace period if no sub record yet
    if (subscription.permanent) return true;
    if (subscription.status === 'active') return true;
    if (subscription.status === 'trial') {
      return new Date(subscription.trial_ends_at) > new Date();
    }
    return false;
  };

  const isCancelled = subscription?.status === 'cancelled';
  const isPermanent = subscription?.permanent === true;
  const isPaid = subscription?.status === 'active';
  const isTrial = subscription?.status === 'trial';
  const trialDaysLeft = getTrialDaysLeft();

  const getStatusLabel = (): string => {
    if (!subscription) return 'Carregando...';
    if (isPermanent) return 'Acesso Permanente';
    if (isPaid) return 'Assinatura Ativa';
    if (isTrial && trialDaysLeft !== null) {
      if (trialDaysLeft <= 0) return 'Trial Expirado';
      return `${trialDaysLeft} dia${trialDaysLeft !== 1 ? 's' : ''} grátis`;
    }
    if (isCancelled) return 'Assinatura Cancelada';
    return 'Expirado';
  };

  const getStatusColor = (): 'green' | 'yellow' | 'red' => {
    if (!subscription) return 'green';
    if (isPermanent || isPaid) return 'green';
    if (isTrial && trialDaysLeft !== null) {
      if (trialDaysLeft <= 0) return 'red';
      if (trialDaysLeft <= 1) return 'red';
      if (trialDaysLeft <= 3) return 'yellow';
      return 'green';
    }
    return 'red';
  };

  const isClickable = (): boolean => {
    const color = getStatusColor();
    return color === 'yellow' || color === 'red';
  };

  return {
    subscription,
    loading,
    isActive: isActive(),
    isCancelled,
    isPermanent,
    isPaid,
    isTrial,
    trialDaysLeft,
    getStatusLabel,
    getStatusColor,
    isClickable,
  };
};

const SubscriptionBlocker = () => {
  const { isActive, isCancelled, loading } = useSubscription();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!loading && !isActive) setOpen(true);
  }, [loading, isActive]);

  if (loading || isActive) return null;

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="max-w-md" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            <AlertCircle className="h-8 w-8 text-destructive" />
          </div>
          <DialogTitle className="text-center text-xl font-black">
            {isCancelled
              ? 'Hey, tivemos problemas com sua assinatura'
              : 'Hey, seu teste gratuito acabou!'}
          </DialogTitle>
          <DialogDescription className="text-center text-base">
            {isCancelled
              ? 'Esperamos poder trabalhar novamente com você! Renove sua assinatura para continuar usando o inSpek.'
              : 'Que tal ter acesso completo à ferramenta? Assine por apenas R$ 10/mês e continue gerenciando seus extintores com eficiência.'}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <Button
            className="w-full h-12 text-lg font-bold gap-2"
            onClick={() => window.open(CHECKOUT_URL, '_blank')}
          >
            <ExternalLink className="h-5 w-5" />
            {isCancelled ? 'Renovar com Cartão' : 'Assinar com Cartão'}
          </Button>
          <Button
            variant="outline"
            className="w-full h-12 text-lg font-bold gap-2"
            onClick={() => window.open(CHECKOUT_URL, '_blank')}
          >
            <ExternalLink className="h-5 w-5" />
            Pagar com PIX
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SubscriptionBlocker;
