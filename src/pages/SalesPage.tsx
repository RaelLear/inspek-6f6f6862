import { Button } from '@/components/ui/button';
import { CheckCircle, Clock, Shield, BarChart3, ArrowRight, AlertTriangle, Frown, MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const WHATSAPP_URL = 'https://wa.me/5531999647782';

const SalesPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-1">
            <img src="/logo-site.png" alt="inSpek" className="h-7 w-7 object-contain" />
            <span className="text-lg font-black tracking-tight">inSpek</span>
          </div>
          <Button variant="outline" size="sm" className="font-bold" onClick={() => navigate('/login')}>
            Login
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-4xl px-4 py-16 text-center md:py-24">
        <h1 className="text-4xl font-black leading-tight tracking-tight md:text-6xl">
          Reduza em 80% o tempo gasto com inspeção de extintores
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
          Pare de perder horas com planilhas desorganizadas e processos manuais. O inSpek automatiza toda a gestão de extintores direto do celular.
        </p>
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Button size="lg" className="h-14 px-8 text-lg font-bold gap-2" onClick={() => navigate('/login')}>
            Teste grátis por 90 dias <ArrowRight className="h-5 w-5" />
          </Button>
        </div>
      </section>

      {/* Problem */}
      <section className="border-t bg-muted/30 py-16">
        <div className="mx-auto max-w-4xl px-4">
          <h2 className="text-center text-3xl font-black md:text-4xl">Você se identifica?</h2>
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {[
              'Preenche planilhas intermináveis todo mês para controlar dezenas de extintores',
              'Perde tempo procurando datas de vencimento e garantias espalhadas em papéis',
              'Já recebeu notificação da fiscalização por extintor vencido que passou despercebido',
              'Sente que o trabalho operacional consome o tempo que deveria investir em crescimento profissional',
            ].map((text, i) => (
              <div key={i} className="flex items-start gap-3 rounded-xl border bg-card p-5">
                <Frown className="h-5 w-5 mt-0.5 shrink-0 text-muted-foreground" />
                <p className="text-sm font-medium">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pain deeper */}
      <section className="py-16">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h2 className="text-3xl font-black md:text-4xl">
            Enquanto você está preso no operacional, outros profissionais estão sendo promovidos
          </h2>
          <p className="mt-6 text-lg text-muted-foreground">
            Cada hora gasta preenchendo formulários é uma hora que você não investe em projetos estratégicos, capacitações ou visibilidade dentro da empresa. O SESMT não precisa ser sinônimo de rotina burocrática.
          </p>
        </div>
      </section>

      {/* Solution */}
      <section className="border-t bg-muted/30 py-16">
        <div className="mx-auto max-w-4xl px-4">
          <h2 className="text-center text-3xl font-black md:text-4xl">
            O inSpek faz o trabalho pesado por você
          </h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {[
              { icon: Clock, title: 'Inspeção em segundos', desc: 'Código + posto + conformidade. Tudo no celular, sem papel.' },
              { icon: Shield, title: 'Zero vencimentos perdidos', desc: 'Alertas automáticos de garantia e 3º nível com antecedência.' },
              { icon: BarChart3, title: 'Métricas claras', desc: 'Dashboards visuais para apresentar resultados à gestão.' },
            ].map((item, i) => (
              <div key={i} className="flex flex-col items-center gap-3 rounded-xl border bg-card p-6 text-center">
                <item.icon className="h-10 w-10 text-foreground" />
                <h3 className="text-lg font-bold">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16">
        <div className="mx-auto max-w-4xl px-4">
          <h2 className="text-center text-3xl font-black md:text-4xl">Como funciona</h2>
          <div className="mt-10 space-y-6">
            {[
              { step: '1', title: 'Cadastre seus extintores', desc: 'Código, posto, tipo, peso e datas. Uma vez e pronto.' },
              { step: '2', title: 'Faça inspeções no celular', desc: 'Navegue pelo fluxo guiado: código, posto, conformidade e datas. Tudo salvo na nuvem.' },
              { step: '3', title: 'Acompanhe tudo no dashboard', desc: 'Status em tempo real, notificações de vencimento e planilhas prontas para imprimir.' },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-4 rounded-xl border bg-card p-5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-foreground text-background font-black text-lg">
                  {item.step}
                </div>
                <div>
                  <h3 className="text-lg font-bold">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Numbers */}
      <section className="border-t bg-muted/30 py-16">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <h2 className="text-3xl font-black md:text-4xl">Resultados reais</h2>
          <div className="mt-10 grid grid-cols-3 gap-6">
            {[
              { number: '80%', label: 'Menos tempo em inspeções' },
              { number: '0', label: 'Extintores vencidos esquecidos' },
              { number: '100%', label: 'Conformidade com NRs' },
            ].map((item, i) => (
              <div key={i} className="rounded-xl border bg-card p-6">
                <p className="text-4xl font-black md:text-5xl">{item.number}</p>
                <p className="mt-2 text-sm font-medium text-muted-foreground">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16">
        <div className="mx-auto max-w-2xl px-4 text-center">
          <h2 className="text-3xl font-black md:text-4xl">Comece agora, sem compromisso</h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Teste o inSpek gratuitamente por 90 dias. Sem cartão de crédito, sem pegadinhas.
          </p>
          <div className="mt-8">
            <Button size="lg" className="h-14 px-8 text-lg font-bold gap-2" onClick={() => navigate('/login')}>
              Teste grátis por 90 dias <ArrowRight className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="mx-auto max-w-4xl px-4">
          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center gap-1">
              <img src="/logo-site.png" alt="inSpek" className="h-4 w-4 object-contain" />
              <span className="font-bold text-foreground">inSpek</span>
            </div>
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <MessageCircle className="h-4 w-4" />
              Entre em Contato
            </a>
            <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} inSpek. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default SalesPage;
