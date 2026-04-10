import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertCircle, MessageCircle } from 'lucide-react';

const WHATSAPP_URL = 'https://wa.me/5531999647782';

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
    if (!subscription) return true;
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
    if (loading) return 'Carregando...';
    if (!subscription) return 'Teste Grátis (90 dias)';
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
  const { isActive, loading } = useSubscription();
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
            Seu período de teste acabou
          </DialogTitle>
          <DialogDescription className="text-center text-base">
            Para continuar utilizando o inSpek com todas as funcionalidades, entre em contato com nosso suporte para ativar seu plano pago.
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-center">
          <Button
            className="h-12 px-8 text-lg font-bold gap-2"
            onClick={() => window.open(WHATSAPP_URL, '_blank')}
          >
            <MessageCircle className="h-5 w-5" />
            Conversar com o Suporte
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SubscriptionBlocker;
