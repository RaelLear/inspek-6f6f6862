import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { X, Check } from 'lucide-react';

interface TutorialStep {
  title: string;
  content: string;
  image?: string;
  highlightSelector?: string;
  requireClick?: boolean;
  mockUI?: 'code' | 'port' | 'conformity' | 'dates';
}

const STEPS: TutorialStep[] = [
  {
    title: 'Bem-vindo ao inSpek',
    content: 'Neste tutorial rápido você aprenderá como utilizar o aplicativo para realizar inspeções de extintores de incêndio de forma simples e organizada.',
  },
  {
    title: 'Botão de Inspeção',
    content: 'Este é o botão Inspeção. É nele que você irá registrar os dados das inspeções dos seus extintores.',
    highlightSelector: '[data-tutorial="fab-inspection"]',
    requireClick: true,
  },
  {
    title: 'Código de referência do extintor',
    content: 'Aqui você pode registrar um código de referência para cada extintor inspecionado. Isso ajuda a identificar cada unidade individualmente.\n\nRecomendamos utilizar os 3 últimos dígitos do número de série do cilindro, que geralmente está gravado na lataria do extintor.',
    mockUI: 'code',
    image: '/tutorial-etiqueta.png',
  },
  {
    title: 'Posição do extintor',
    content: 'Aqui você pode registrar a posição do extintor no ambiente.\n\nRecomendamos utilizar identificação na própria placa do extintor, com adesivo ou escrita de marcação, para facilitar a localização durante as inspeções.',
    mockUI: 'port',
    image: '/tutorial-placa.png',
  },
  {
    title: 'Requisitos de inspeção',
    content: 'Nesta etapa você irá verificar os requisitos básicos de inspeção do extintor.\n\nCaso algum item não esteja conforme, o extintor será automaticamente marcado com o status "Em revisão". Caso seja referente à placa ou pintura do piso, apenas irá solicitar uma descrição Opcional.',
    mockUI: 'conformity',
  },
  {
    title: 'Datas de validade',
    content: 'Aqui você deve registrar as duas principais datas do extintor:\n\n• Vencimento da garantia / 1º nível de manutenção\n• Vencimento do 3º nível (teste hidrostático)\n\nApós registrar uma vez, essas datas serão preenchidas automaticamente nas próximas inspeções.\n\nSe alguma data estiver próxima do vencimento, o aplicativo irá notificar no menu inicial.',
    mockUI: 'dates',
  },
  {
    title: 'Tutorial concluído',
    content: 'Inspeção registrada com sucesso.\nAgora vamos conhecer algumas funções do aplicativo.',
  },
  {
    title: 'Gerenciar extintores',
    content: 'Nesta área você poderá gerenciar todos os seus pontos e extintores cadastrados.',
    highlightSelector: '[data-tutorial="btn-manager"]',
  },
  {
    title: 'Planilha geral',
    content: 'Aqui ficam os registros de inspeções realizadas no mês selecionado.\n\nTambém é possível gerar e imprimir uma planilha, ideal para arquivamento ou auditorias.',
    highlightSelector: '[data-tutorial="btn-spreadsheet"]',
  },
  {
    title: 'Métricas',
    content: 'Nesta área você pode visualizar as métricas de inspeção do ano.\n\nIsso permite acompanhar, por exemplo:\n• Quantidade de inspeções realizadas\n• Número de extintores enviados para revisão',
    highlightSelector: '[data-tutorial="btn-metrics"]',
  },
  {
    title: 'Informação importante',
    content: 'Em muitos casos, empresas terceirizadas devolvem extintores diferentes dos que foram enviados para revisão.\n\nPor esse motivo, quando um extintor é marcado como enviado para revisão, o aplicativo remove o registro da unidade após a confirmação da troca.\n\nAssim, na próxima inspeção você irá registrar os novos extintores recebidos, garantindo um controle correto da identificação e rastreabilidade dos equipamentos.',
  },
];

// Mock UI components for tutorial illustrations
const MockCodeUI = () => (
  <div className="rounded-xl border bg-card shadow-lg overflow-hidden text-xs">
    <div className="border-b px-3 py-2 font-black text-sm">Código do Extintor</div>
    <div className="p-3 space-y-2">
      <div className="rounded-lg border bg-muted/30 px-3 py-2 text-center">
        <p className="text-muted-foreground text-xs">Código</p>
        <p className="text-2xl font-black tracking-widest">1 2 3</p>
      </div>
      <div className="grid grid-cols-3 gap-1">
        {[1,2,3,4,5,6,7,8,9,'←',0,'→'].map((k, i) => (
          <div key={i} className={`rounded-lg py-1.5 text-center font-bold text-xs ${k === '→' ? 'bg-foreground text-background' : 'bg-muted border'}`}>
            {k}
          </div>
        ))}
      </div>
    </div>
  </div>
);

const MockPortUI = () => (
  <div className="rounded-xl border bg-card shadow-lg overflow-hidden text-xs">
    <div className="border-b px-3 py-2 font-black text-sm">Ponto</div>
    <div className="p-3 space-y-2">
      <div className="rounded-lg border bg-muted/30 px-3 py-2 text-center">
        <p className="text-muted-foreground text-xs">Ponto</p>
        <p className="text-2xl font-black tracking-widest">0 1</p>
      </div>
      <div className="grid grid-cols-3 gap-1">
        {[1,2,3,4,5,6,7,8,9,'←',0,'→'].map((k, i) => (
          <div key={i} className={`rounded-lg py-1.5 text-center font-bold text-xs ${k === '→' ? 'bg-foreground text-background' : 'bg-muted border'}`}>
            {k}
          </div>
        ))}
      </div>
    </div>
  </div>
);

const MockConformityUI = () => (
  <div className="rounded-xl border bg-card shadow-lg overflow-hidden text-xs w-full">
    <div className="border-b px-3 py-2 font-black text-sm">Conformidade</div>
    <div className="p-3 space-y-2.5">
      {['Manômetro', 'Lacre', 'Placa', 'Pintura'].map((label, i) => (
        <div key={i} className="space-y-1">
          <p className="font-bold text-xs">{label}</p>
          <div className="flex gap-1.5">
            <div className={`flex-1 rounded-lg py-1.5 text-center text-xs font-bold flex items-center justify-center gap-1 ${i < 2 ? 'bg-status-approved/20 border border-status-approved text-status-approved' : 'border text-muted-foreground'}`}>
              <Check className="h-3 w-3" /> Conforme
            </div>
            <div className="flex-1 rounded-lg py-1.5 text-center text-xs border text-muted-foreground">
              Não conf.
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const MockDatesUI = () => (
  <div className="rounded-xl border bg-card shadow-lg overflow-hidden text-xs">
    <div className="border-b px-3 py-2 font-black text-sm">Datas</div>
    <div className="p-3 space-y-2">
      <div className="rounded-lg bg-foreground text-background px-3 py-2">
        <p className="text-xs opacity-70">Data da Inspeção</p>
        <p className="font-bold">09/03/2026</p>
      </div>
      <div className="rounded-lg border px-3 py-2">
        <p className="text-xs text-muted-foreground">Vencimento Garantia *</p>
        <p className="font-bold">03/2027</p>
      </div>
      <div className="rounded-lg border px-3 py-2">
        <p className="text-xs text-muted-foreground">3º Nível *</p>
        <p className="font-bold text-status-review">2025</p>
      </div>
      <div className="rounded-lg bg-foreground text-background px-3 py-2 text-center font-bold">
        Registrar Inspeção
      </div>
    </div>
  </div>
);

const MockUIComponents = {
  code: MockCodeUI,
  port: MockPortUI,
  conformity: MockConformityUI,
  dates: MockDatesUI,
};

interface Props {
  onComplete: () => void;
}

const OnboardingTutorial = ({ onComplete }: Props) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [highlightRect, setHighlightRect] = useState<DOMRect | null>(null);

  const step = STEPS[currentStep];

  const updateHighlight = useCallback(() => {
    if (step.highlightSelector) {
      const el = document.querySelector(step.highlightSelector);
      if (el) {
        setHighlightRect(el.getBoundingClientRect());
        return;
      }
    }
    setHighlightRect(null);
  }, [step.highlightSelector]);

  useEffect(() => {
    updateHighlight();
    window.addEventListener('resize', updateHighlight);
    window.addEventListener('scroll', updateHighlight);
    return () => {
      window.removeEventListener('resize', updateHighlight);
      window.removeEventListener('scroll', updateHighlight);
    };
  }, [updateHighlight]);

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      localStorage.setItem('inspek-tutorial-done', 'true');
      onComplete();
    }
  };

  const handleSkip = () => {
    localStorage.setItem('inspek-tutorial-done', 'true');
    onComplete();
  };

  const handleHighlightClick = () => {
    if (step.requireClick) {
      handleNext();
    }
  };

  const pad = 8;
  const MockUI = step.mockUI ? MockUIComponents[step.mockUI] : null;
  const isConformityStep = step.mockUI === 'conformity';

  // Determine card position
  const getCardTop = () => {
    if (highlightRect) {
      if (highlightRect.bottom + pad + 16 > window.innerHeight * 0.6) {
        return Math.max(16, highlightRect.top - pad - 320);
      }
      return highlightRect.bottom + pad + 16;
    }
    return '50%';
  };

  return (
    <div className="fixed inset-0 z-[9998]">
      {/* Dark overlay with cutout */}
      <svg className="absolute inset-0 w-full h-full" style={{ pointerEvents: 'none' }}>
        <defs>
          <mask id="tutorial-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {highlightRect && (
              <rect
                x={highlightRect.left - pad}
                y={highlightRect.top - pad}
                width={highlightRect.width + pad * 2}
                height={highlightRect.height + pad * 2}
                rx="12"
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect
          x="0" y="0" width="100%" height="100%" fill="rgba(0,0,0,0.75)"
          mask="url(#tutorial-mask)"
          style={{ pointerEvents: 'all' }}
          onClick={(e) => e.stopPropagation()}
        />
      </svg>

      {/* Clickable highlight area */}
      {highlightRect && (
        <div
          className="absolute rounded-xl border-2 border-background/50"
          style={{
            left: highlightRect.left - pad,
            top: highlightRect.top - pad,
            width: highlightRect.width + pad * 2,
            height: highlightRect.height + pad * 2,
            zIndex: 9999,
            cursor: step.requireClick ? 'pointer' : 'default',
            pointerEvents: step.requireClick ? 'auto' : 'none',
          }}
          onClick={handleHighlightClick}
        />
      )}

      {/* Content card */}
      <div
        className="absolute left-1/2 -translate-x-1/2 w-[92vw] max-w-md bg-card border rounded-2xl shadow-2xl space-y-3 p-5"
        style={{
          zIndex: 9999,
          top: getCardTop(),
          transform: highlightRect ? 'translateX(-50%)' : 'translate(-50%, -50%)',
          maxHeight: '85vh',
          overflowY: 'auto',
        }}
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-muted-foreground font-bold">{currentStep + 1}/{STEPS.length}</p>
            <h3 className="text-lg font-black mt-1">{step.title}</h3>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={handleSkip}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Layout: for conformity step, show mock UI full width above text */}
        {MockUI && isConformityStep ? (
          <div className="space-y-3">
            <div className="w-full">
              <MockUI />
            </div>
            <p className="text-sm text-muted-foreground whitespace-pre-line">{step.content}</p>
          </div>
        ) : MockUI ? (
          <div className="flex gap-3 items-start">
            <div className="flex-1 min-w-0">
              <p className="text-sm text-muted-foreground whitespace-pre-line">{step.content}</p>
            </div>
            <div className="w-36 shrink-0">
              <MockUI />
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground whitespace-pre-line">{step.content}</p>
        )}

        {step.image && (
          <img src={step.image} alt="" className="w-full rounded-lg border max-h-40 object-contain" />
        )}

        <div className="flex gap-2 justify-between">
          <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={handleSkip}>
            Pular tutorial
          </Button>
          {!step.requireClick && (
            <Button size="sm" className="font-bold bg-foreground text-background hover:bg-foreground/90" onClick={handleNext}>
              {currentStep === STEPS.length - 1 ? 'Concluir' : 'Próximo'}
            </Button>
          )}
          {step.requireClick && (
            <p className="text-xs text-muted-foreground self-center">Clique no elemento destacado</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default OnboardingTutorial;
