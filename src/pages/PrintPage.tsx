import { useEffect, useState, useRef, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Inspection, displayWarranty, displayThirdLevel } from '@/lib/types';
import { useSubscription } from '@/components/SubscriptionBlocker';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Download, Share2, ArrowLeft, Printer } from 'lucide-react';
import { toast } from 'sonner';
import html2canvas from 'html2canvas';

const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

const A4_WIDTH = 794;
const A4_HEIGHT = 1123;
const PAGE_PADDING_TOP = 60;
const PAGE_PADDING_BOTTOM = 60;
const PAGE_PADDING_X = 40;
const HEADER_HEIGHT = 80;
const INFO_BAR_HEIGHT = 40;
const FOOTER_HEIGHT = 100;
const ROW_HEIGHT = 34;
const HEADER_ROW_HEIGHT = 36;

const PrintPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isPaid, isPermanent } = useSubscription();
  const month = parseInt(searchParams.get('month') || String(new Date().getMonth()));
  const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()));
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const printRef = useRef<HTMLDivElement>(null);
  const [showPromo, setShowPromo] = useState(false);

  const isSubscribed = isPaid || isPermanent;

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from('inspections').select('*');
      if (data) setInspections(data as Inspection[]);
    };
    fetch();
  }, []);

  const filtered = useMemo(() => {
    return inspections.filter((insp) => {
      const parts = insp.inspection_date.split('/');
      if (parts.length !== 3) return false;
      return parseInt(parts[1]) - 1 === month && parseInt(parts[2]) === year;
    }).sort((a, b) => parseInt(a.port) - parseInt(b.port));
  }, [inspections, month, year]);

  const contentAreaPerFirstPage = A4_HEIGHT - PAGE_PADDING_TOP - PAGE_PADDING_BOTTOM - HEADER_HEIGHT - INFO_BAR_HEIGHT - FOOTER_HEIGHT;
  const contentAreaPerExtraPage = A4_HEIGHT - PAGE_PADDING_TOP - PAGE_PADDING_BOTTOM - FOOTER_HEIGHT;
  const rowsFirstPage = Math.floor((contentAreaPerFirstPage - HEADER_ROW_HEIGHT) / ROW_HEIGHT);
  const rowsPerExtraPage = Math.floor((contentAreaPerExtraPage - HEADER_ROW_HEIGHT) / ROW_HEIGHT);

  const totalRows = filtered.length;
  let totalPages = 1;
  if (totalRows > rowsFirstPage) {
    totalPages = 1 + Math.ceil((totalRows - rowsFirstPage) / rowsPerExtraPage);
  }

  const getPageRows = (pageIndex: number) => {
    if (pageIndex === 0) return filtered.slice(0, rowsFirstPage);
    const start = rowsFirstPage + (pageIndex - 1) * rowsPerExtraPage;
    return filtered.slice(start, start + rowsPerExtraPage);
  };

  const isLastPage = (pageIndex: number) => pageIndex === totalPages - 1;

  const applyCloneStyles = (clone: HTMLElement) => {
    const cells = clone.querySelectorAll('td, th');
    cells.forEach((cell) => {
      const el = cell as HTMLElement;
      el.style.verticalAlign = 'middle';
      el.style.textAlign = 'center';
      el.style.lineHeight = '1.2';
      el.style.overflow = 'visible';
      el.style.whiteSpace = 'nowrap';
      el.style.padding = '8px 8px';
      el.style.fontSize = '12px';
    });
    const ths = clone.querySelectorAll('th');
    ths.forEach((th) => {
      const el = th as HTMLElement;
      el.style.fontSize = '12px';
      el.style.padding = '10px 8px';
    });
  };

  const handleDownload = async () => {
    if (!printRef.current) return;
    try {
      const pages = printRef.current.querySelectorAll('.print-page');
      for (let i = 0; i < pages.length; i++) {
        const clone = (pages[i] as HTMLElement).cloneNode(true) as HTMLElement;
        clone.style.position = 'absolute';
        clone.style.left = '-9999px';
        clone.style.top = '0';
        document.body.appendChild(clone);
        applyCloneStyles(clone);
        const canvas = await html2canvas(clone, {
          scale: 2, backgroundColor: '#ffffff', useCORS: true,
          width: A4_WIDTH, height: A4_HEIGHT, windowWidth: A4_WIDTH, windowHeight: A4_HEIGHT, logging: false,
        });
        document.body.removeChild(clone);
        const link = document.createElement('a');
        link.download = `inspecao-${MONTHS[month]}-${year}${pages.length > 1 ? `-p${i + 1}` : ''}.png`;
        link.href = canvas.toDataURL('image/png', 1.0);
        link.click();
      }
      toast.success('Download realizado!');
    } catch {
      toast.error('Erro ao gerar imagem.');
    }
  };

  const handleShare = async () => {
    if (!printRef.current) return;
    try {
      const pages = printRef.current.querySelectorAll('.print-page');
      const files: File[] = [];
      for (let i = 0; i < pages.length; i++) {
        const clone = (pages[i] as HTMLElement).cloneNode(true) as HTMLElement;
        clone.style.position = 'absolute';
        clone.style.left = '-9999px';
        clone.style.top = '0';
        document.body.appendChild(clone);
        applyCloneStyles(clone);
        const canvas = await html2canvas(clone, {
          scale: 2, backgroundColor: '#ffffff', useCORS: true,
          width: A4_WIDTH, height: A4_HEIGHT, windowWidth: A4_WIDTH, windowHeight: A4_HEIGHT, logging: false,
        });
        document.body.removeChild(clone);
        const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, 'image/png', 1.0));
        if (blob) files.push(new File([blob], `inspecao-${MONTHS[month]}-${year}-p${i + 1}.png`, { type: 'image/png' }));
      }
      if (navigator.share && files.length) {
        await navigator.share({ files, title: `Inspeção ${MONTHS[month]} ${year}` });
      } else {
        toast.error('Compartilhamento não suportado neste navegador.');
      }
    } catch {
      toast.error('Erro ao compartilhar.');
    }
  };

  const handlePrint = () => { window.print(); };

  const showWatermark = !isSubscribed || showPromo;

  const thStyle: React.CSSProperties = {
    border: '2.5px solid #111', padding: '10px 8px', textAlign: 'center',
    backgroundColor: '#e0e0e0', fontWeight: 900, fontSize: '13px',
    verticalAlign: 'middle', lineHeight: '1.2', height: `${HEADER_ROW_HEIGHT}px`,
    color: '#000',
  };

  const tdStyle: React.CSSProperties = {
    border: '2px solid #333', padding: '8px 8px', textAlign: 'center',
    verticalAlign: 'middle', fontSize: '13px', lineHeight: '1.2', height: `${ROW_HEIGHT}px`,
    fontWeight: 700, color: '#000',
  };

  const TableHeader = () => (
    <thead>
      <tr>
        <th style={thStyle}>Código</th>
        <th style={thStyle}>Ponto</th>
        <th style={thStyle}>Data</th>
        <th style={thStyle}>Manômetro</th>
        <th style={thStyle}>Lacre</th>
        <th style={thStyle}>Placa</th>
        <th style={thStyle}>Piso</th>
        <th style={thStyle}>Garantia</th>
        <th style={thStyle}>3º Nível</th>
      </tr>
    </thead>
  );

  const TableRows = ({ rows }: { rows: Inspection[] }) => (
    <tbody>
      {rows.map((insp) => (
        <tr key={insp.id}>
          <td style={{ ...tdStyle, fontWeight: 'bold' }}>{insp.code}</td>
          <td style={tdStyle}>{insp.port}</td>
          <td style={tdStyle}>{insp.inspection_date}</td>
          <td style={{ ...tdStyle, fontSize: '14px' }}>{insp.manometer_status === 'Conforme' ? '✓' : '✗'}</td>
          <td style={{ ...tdStyle, fontSize: '14px' }}>{insp.seal_status === 'Conforme' ? '✓' : '✗'}</td>
          <td style={{ ...tdStyle, fontSize: '14px' }}>{insp.plate_status === 'Conforme' ? '✓' : '✗'}</td>
          <td style={{ ...tdStyle, fontSize: '14px' }}>{insp.floor_paint_status === 'Conforme' ? '✓' : '✗'}</td>
          <td style={tdStyle}>{displayWarranty(insp.warranty_expiry)}</td>
          <td style={tdStyle}>{displayThirdLevel(insp.third_level)}</td>
        </tr>
      ))}
    </tbody>
  );

  const SignatureFooter = () => (
    <div style={{ position: 'absolute', bottom: `${PAGE_PADDING_BOTTOM + 60}px`, left: `${PAGE_PADDING_X}px`, right: `${PAGE_PADDING_X}px` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#222', marginBottom: '40px', fontWeight: 700 }}>
        <span>Total de registros: {filtered.length}</span>
        <span>Documento gerado em {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ borderTop: '2px solid #000', width: '250px', margin: '0 auto', paddingTop: '6px' }}>
          <p style={{ fontSize: '11px', margin: 0, fontWeight: 700 }}>Assinatura de validação</p>
        </div>
      </div>
    </div>
  );

  const pageStyle: React.CSSProperties = {
    fontFamily: 'Arial, sans-serif',
    width: `${A4_WIDTH}px`,
    height: `${A4_HEIGHT}px`,
    padding: `${PAGE_PADDING_TOP}px ${PAGE_PADDING_X}px ${PAGE_PADDING_BOTTOM}px`,
    boxSizing: 'border-box',
    position: 'relative',
    overflow: 'hidden',
    pageBreakAfter: 'always',
  };

  const PageHeader = () => (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '2.5px solid #000', paddingBottom: '14px', marginBottom: '8px' }}>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: '22px', fontWeight: 900, letterSpacing: '1.5px', margin: 0, color: '#000' }}>RELATÓRIO DE INSPEÇÃO DE EXTINTORES</h1>
          <p style={{ fontSize: '13px', marginTop: '6px', color: '#111', fontWeight: 700 }}>Controle Mensal de Inspeção e Manutenção</p>
        </div>
      </div>
      {showWatermark && (
        <div style={{ fontSize: '9px', color: '#999', textAlign: 'left', marginBottom: '4px' }}>
          Feito com: inspek.lovable.app
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', margin: '8px 0 18px', color: '#000', fontWeight: 700 }}>
        <span><strong>Referência:</strong> {MONTHS[month]} de {year}</span>
        <span><strong>Emissão:</strong> {new Date().toLocaleDateString('pt-BR')}</span>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="no-print flex items-center gap-3 p-4 border-b">
        <Button variant="ghost" onClick={() => navigate('/dashboard')}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
        </Button>
        {isSubscribed && (
          <div className="flex items-center gap-2 ml-2">
            <Switch checked={showPromo} onCheckedChange={setShowPromo} />
            <span className="text-xs text-muted-foreground">Divulgue nosso trabalho</span>
          </div>
        )}
        <div className="ml-auto flex gap-2">
          <Button variant="outline" className="gap-2" onClick={handlePrint}>
            <Printer className="h-4 w-4" /> Imprimir
          </Button>
          <Button variant="outline" className="gap-2" onClick={handleDownload}>
            <Download className="h-4 w-4" /> Download
          </Button>
          <Button variant="outline" className="gap-2" onClick={handleShare}>
            <Share2 className="h-4 w-4" /> Compartilhar
          </Button>
        </div>
      </div>

      <div ref={printRef} className="flex flex-col items-center p-4 gap-4 print:p-0 print:gap-0">
        {filtered.length === 0 ? (
          <div className="print-page bg-white text-black" style={pageStyle}>
            <PageHeader />
            <p style={{ textAlign: 'center', color: '#999', padding: '40px 0', fontSize: '12px' }}>Nenhuma inspeção encontrada para este período.</p>
            <SignatureFooter />
          </div>
        ) : (
          Array.from({ length: totalPages }).map((_, pageIndex) => {
            const rows = getPageRows(pageIndex);
            return (
              <div key={pageIndex} className="print-page bg-white text-black" style={pageStyle}>
                {pageIndex === 0 && <PageHeader />}
                {pageIndex > 0 && (
                  <div style={{ fontSize: '10px', color: '#999', marginBottom: '12px', textAlign: 'right' }}>
                    Página {pageIndex + 1} de {totalPages}
                  </div>
                )}
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px' }}>
                  <TableHeader />
                  <TableRows rows={rows} />
                </table>
                {isLastPage(pageIndex) && <SignatureFooter />}
              </div>
            );
          })
        )}
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { margin: 0; padding: 0; }
          .print-page {
            page-break-after: always;
            margin: 0 !important;
            box-shadow: none !important;
          }
          .print-page:last-child {
            page-break-after: auto;
          }
        }
        @page {
          size: A4 portrait;
          margin: 0;
        }
      `}</style>
      <div className="fixed bottom-0 left-0 right-0 h-16 bg-white z-50 print:block hidden" />
    </div>
  );
};

export default PrintPage;
