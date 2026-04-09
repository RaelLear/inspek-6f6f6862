import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Shield, ShieldCheck, Search, Copy, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface UserProfile {
  id: string;
  email: string;
  display_name: string;
  created_at: string;
  subscription: {
    status: string;
    trial_ends_at: string;
    permanent: boolean;
  } | null;
}

const AdminPage = () => {
  const [authenticated, setAuthenticated] = useState(false);
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID || 'vishfjhdwtfejbohakpx';
  const cardWebhookUrl = `https://${projectId}.supabase.co/functions/v1/subscription-webhook`;
  const pixWebhookUrl = `https://${projectId}.supabase.co/functions/v1/pix-webhook`;

  const handleLogin = () => {
    if (code === '648808' && password === 'seguranca') {
      setAuthenticated(true);
      fetchUsers();
    } else {
      toast.error('Acesso negado');
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase.functions.invoke('admin-operations', {
      body: { action: 'list_users', adminCode: '648808', adminPassword: 'seguranca' },
    });
    if (error) { toast.error('Erro ao carregar usuários'); setLoading(false); return; }
    setUsers(data.users || []);
    setLoading(false);
  };

  const handleGrantPermanent = async (userId: string) => {
    const { error } = await supabase.functions.invoke('admin-operations', {
      body: { action: 'grant_permanent', adminCode: '648808', adminPassword: 'seguranca', targetUserId: userId },
    });
    if (error) { toast.error('Erro'); return; }
    toast.success('Acesso permanente concedido!');
    fetchUsers();
  };

  const handleRevokePermanent = async (userId: string) => {
    const { error } = await supabase.functions.invoke('admin-operations', {
      body: { action: 'revoke_permanent', adminCode: '648808', adminPassword: 'seguranca', targetUserId: userId },
    });
    if (error) { toast.error('Erro'); return; }
    toast.success('Acesso permanente revogado');
    fetchUsers();
  };

  const filtered = users.filter(u =>
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.display_name?.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusBadge = (user: UserProfile) => {
    if (!user.subscription) return <span className="text-xs text-muted-foreground">Sem registro</span>;
    if (user.subscription.permanent) return <span className="text-xs font-bold text-status-approved">Permanente</span>;
    if (user.subscription.status === 'active') return <span className="text-xs font-bold text-status-approved">Ativo</span>;
    if (user.subscription.status === 'trial') {
      const trialEnd = new Date(user.subscription.trial_ends_at);
      const daysLeft = Math.max(0, Math.ceil((trialEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
      return <span className={`text-xs font-bold ${daysLeft <= 0 ? 'text-destructive' : daysLeft <= 3 ? 'text-yellow-500' : 'text-status-review'}`}>
        {daysLeft <= 0 ? 'Trial expirado' : `${daysLeft} dias grátis`}
      </span>;
    }
    if (user.subscription.status === 'cancelled') return <span className="text-xs font-bold text-destructive">Cancelado</span>;
    return <span className="text-xs font-bold text-destructive">Expirado</span>;
  };

  const WebhookSection = ({ title, url }: { title: string; url: string }) => (
    <div className="rounded-xl border bg-card p-4 space-y-2">
      <h3 className="text-sm font-bold">{title}</h3>
      <p className="text-xs text-muted-foreground">Configure este URL no seu gateway de pagamento:</p>
      <div className="flex items-center gap-2">
        <code className="flex-1 rounded-lg bg-muted px-3 py-2 text-xs font-mono break-all">{url}</code>
        <Button variant="outline" size="icon" onClick={() => { navigator.clipboard.writeText(url); toast.success('Copiado!'); }}>
          <Copy className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  if (!authenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-sm space-y-6">
          <div className="flex flex-col items-center gap-2">
            <Shield className="h-12 w-12 text-foreground" />
            <h1 className="text-2xl font-black">Admin</h1>
          </div>
          <Input placeholder="Código" value={code} onChange={e => setCode(e.target.value)} className="h-12 text-center text-lg font-mono" />
          <Input type="password" placeholder="Senha" value={password} onChange={e => setPassword(e.target.value)} className="h-12 text-center text-lg" />
          <Button className="w-full h-12 font-bold" onClick={handleLogin}>Entrar</Button>
          <button className="w-full text-sm text-muted-foreground hover:text-foreground" onClick={() => navigate('/')}>← Voltar</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 flex items-center justify-between border-b bg-background/95 backdrop-blur px-4 py-3">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <ShieldCheck className="h-6 w-6" />
          <span className="text-lg font-black">Admin Panel</span>
        </div>
        <span className="text-xs text-muted-foreground">{users.length} usuários</span>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-6 space-y-6">
        <WebhookSection title="Webhook de Cartão (card_paid)" url={cardWebhookUrl} />
        <div className="text-xs text-muted-foreground space-y-1 px-4">
          <p><strong>Eventos:</strong> <code>payment_confirmed</code> / <code>subscription_activated</code> → Ativa | <code>subscription_cancelled</code> / <code>payment_failed</code> → Cancela</p>
          <p><strong>Payload:</strong> {`{ "event": "...", "email": "user@email.com" }`}</p>
        </div>

        <WebhookSection title="Webhook de PIX (pix_paid)" url={pixWebhookUrl} />
        <div className="text-xs text-muted-foreground space-y-1 px-4">
          <p><strong>Evento:</strong> <code>pix_paid</code> → Libera 30 dias de acesso</p>
          <p><strong>Payload:</strong> {`{ "event": "pix_paid", "email": "user@email.com" }`}</p>
        </div>

        {/* Search */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar por email ou nome..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
          </div>
          <Button variant="outline" onClick={fetchUsers} disabled={loading}>{loading ? 'Carregando...' : 'Atualizar'}</Button>
        </div>

        {/* Users list */}
        <div className="space-y-2">
          {filtered.map(user => (
            <div key={user.id} className="flex items-center justify-between rounded-xl border bg-card p-4">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold truncate">{user.display_name || '-'}</p>
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                <div className="mt-1">{getStatusBadge(user)}</div>
              </div>
              <div className="flex gap-2 ml-3">
                {user.subscription?.permanent ? (
                  <Button variant="outline" size="sm" className="text-destructive border-destructive" onClick={() => handleRevokePermanent(user.id)}>
                    Revogar
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" className="text-status-approved border-status-approved" onClick={() => handleGrantPermanent(user.id)}>
                    Liberar Permanente
                  </Button>
                )}
              </div>
            </div>
          ))}
          {filtered.length === 0 && !loading && (
            <p className="text-center text-sm text-muted-foreground py-8">Nenhum usuário encontrado</p>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminPage;
