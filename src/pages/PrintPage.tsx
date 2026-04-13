import { useEffect, useState, useRef, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Inspection, displayWarranty, displayThirdLevel } from '@/lib/types';
import { useSubscription } from '@/components/SubscriptionBlocker';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Printer } from 'lucide-react';

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
  const { currentTeamId } = useWorkspace();
  const month = parseInt(searchParams.get('month') || String(new Date().getMonth()));
  const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()));
  const conformityFilter = searchParams.get('conformity') || 'all';
  const subcategoryFilter = searchParams.get('subcategory') || 'all';
  const warrantyMonthFilter = searchParams.get('warrantyMonth') || 'all';
  const warrantyYearFilter = searchParams.get('warrantyYear') || 'all';
  const thirdLevelYearFilter = searchParams.get('thirdLevelYear') || 'all';
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const printRef = useRef<HTMLDivElement>(null);
  const [showPromo, setShowPromo] = useState(false);

  const isSubscribed = isPaid || isPermanent;

  useEffect(() => {
    const fetch = async () => {
      let query = (supabase.from as any)('inspections').select('*');
      if (currentTeamId) {
        query = query.eq('team_id', currentTeamId);
      } else {
        query = query.is('team_id', null);
      }
      const { data } = await query;
      if (data) setInspections(data as Inspection[]);
    };
    fetch();
  }, [currentTeamId]);

  const filtered = useMemo(() => {
    // Step 1: Filter by month/year
    let result = inspections.filter((insp) => {
      const parts = insp.inspection_date.split('/');
      if (parts.length !== 3) return false;
      return parseInt(parts[1]) - 1 === month && parseInt(parts[2]) === year;
    });

    // Step 2: Apply conformity filter (same logic as SpreadsheetDialog)
    if (conformityFilter !== 'all') {
      const isConforme = conformityFilter === 'conforme';
      result = result.filter((insp) => {
        if (subcategoryFilter === 'all') {
          const statuses = [insp.manometer_status, insp.seal_status, insp.plate_status, insp.floor_paint_status];
          return isConforme ? statuses.every(s => s === 'Conforme') : statuses.some(s => s === 'Não Conforme');
        }
        const statusMap: Record<string, string> = {
          manometer: insp.manometer_status, seal: insp.seal_status, plate: insp.plate_status, floorPaint: insp.floor_paint_status,
        };
        const status = statusMap[subcategoryFilter];
        return isConforme ? status === 'Conforme' : status === 'Não Conforme';
      });
    }

    // Step 3: Warranty filters
    if (warrantyMonthFilter !== 'all' || warrantyYearFilter !== 'all') {
      result = result.filter((insp) => {
        if (!insp.warranty_expiry) return false;
        const parts = insp.warranty_expiry.split('/');
        if (parts.length !== 3) return false;
        if (warrantyMonthFilter !== 'all' && parts[1] !== warrantyMonthFilter.padStart(2, '0')) return false;
        if (warrantyYearFilter !== 'all' && parts[2] !== warrantyYearFilter) return false;
        return true;
      });
    }

    // Step 4: Third level filter
    if (thirdLevelYearFilter !== 'all') {
      result = result.filter((insp) => {
        if (!insp.third_level) return false;
        const parts = insp.third_level.split('/');
        if (parts.length !== 3) return false;
        return parts[2] === thirdLevelYearFilter;
      });
    }

    return result.sort((a, b) => parseInt(a.port) - parseInt(b.port));
  }, [inspections, month, year, conformityFilter, subcategoryFilter, warrantyMonthFilter, warrantyYearFilter, thirdLevelYearFilter]);

  // Descriptions block - inspections that have optional descriptions
  const descriptionsData = useMemo(() => {
    return filtered.filter(insp => 
      (insp.plate_description && insp.plate_description.trim()) || 
      (insp.floor_paint_description && insp.floor_paint_description.trim())
    );
  }, [filtered]);

  const contentAreaPerFirstPage = A4_HEIGHT - PAGE_PADDING_TOP - PAGE_PADDING_BOTTOM - HEADER_HEIGHT - INFO_BAR_HEIGHT - FOOTER_HEIGHT;
  const contentAreaPerExtraPage = A4_HEIGHT - PAGE_PADDING_TOP - PAGE_PADDING_BOTTOM - FOOTER_HEIGHT;
  const rowsFirstPage = Math.floor((contentAreaPerFirstPage - HEADER_ROW_HEIGHT) / ROW_HEIGHT);
  const rowsPerExtraPage = Math.floor((contentAreaPerExtraPage - HEADER_ROW_HEIGHT) / ROW_HEIGHT);

  const totalRows = filtered.length;
  let totalPages = 1;
  if (totalRows > rowsFirstPage) {
    totalPages = 1 + Math.ceil((totalRows - rowsFirstPage) / rowsPerExtraPage);
  }
  // Add extra page for descriptions if any
  const hasDescriptions = descriptionsData.length > 0;
  const totalPagesWithDescriptions = hasDescriptions ? totalPages + 1 : totalPages;

  const getPageRows = (pageIndex: number) => {
    if (pageIndex === 0) return filtered.slice(0, rowsFirstPage);
    const start = rowsFirstPage + (pageIndex - 1) * rowsPerExtraPage;
    return filtered.slice(start, start + rowsPerExtraPage);
  };

  const isLastPage = (pageIndex: number) => pageIndex === totalPagesWithDescriptions - 1;

  const handlePrint = () => { window.print(); };

  const showWatermark = !isSubscribed || showPromo;

  const getStatusSymbol = (status: string) => {
    if (status === '-') return '-';
    return status === 'Conforme' ? '✓' : '✗';
  };

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
        <th style={thStyle}>Posto</th>
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
          <td style={{ ...tdStyle, fontSize: '14px' }}>{getStatusSymbol(insp.manometer_status)}</td>
          <td style={{ ...tdStyle, fontSize: '14px' }}>{getStatusSymbol(insp.seal_status)}</td>
          <td style={{ ...tdStyle, fontSize: '14px' }}>{getStatusSymbol(insp.plate_status)}</td>
          <td style={{ ...tdStyle, fontSize: '14px' }}>{getStatusSymbol(insp.floor_paint_status)}</td>
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
      <div className="no-print flex items-center gap-2 px-3 py-1.5 border-b">
        <Button variant="ghost" onClick={() => navigate('/extintores')}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
        </Button>
        {isSubscribed && (
          <div className="flex items-center gap-2 ml-2">
            <Switch checked={showPromo} onCheckedChange={setShowPromo} />
            <span className="text-xs text-muted-foreground">Divulgue nosso trabalho</span>
          </div>
        )}
        <div className="ml-auto">
          <Button variant="outline" className="gap-2" onClick={handlePrint}>
            <Printer className="h-4 w-4" /> Imprimir
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
          <>
            {Array.from({ length: totalPages }).map((_, pageIndex) => {
              const rows = getPageRows(pageIndex);
              return (
                <div key={pageIndex} className="print-page bg-white text-black" style={pageStyle}>
                  {pageIndex === 0 && <PageHeader />}
                  {pageIndex > 0 && (
                    <div style={{ fontSize: '10px', color: '#999', marginBottom: '12px', textAlign: 'right' }}>
                      Página {pageIndex + 1} de {totalPagesWithDescriptions}
                    </div>
                  )}
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px' }}>
                    <TableHeader />
                    <TableRows rows={rows} />
                  </table>
                  {!hasDescriptions && isLastPage(pageIndex) && <SignatureFooter />}
                </div>
              );
            })}
            {hasDescriptions && (
              <div className="print-page bg-white text-black" style={pageStyle}>
                <div style={{ fontSize: '10px', color: '#999', marginBottom: '12px', textAlign: 'right' }}>
                  Página {totalPages + 1} de {totalPagesWithDescriptions}
                </div>
                <h2 style={{ fontSize: '16px', fontWeight: 900, marginBottom: '16px', borderBottom: '2px solid #000', paddingBottom: '8px', color: '#000' }}>
                  Observações das Inspeções
                </h2>
                <div style={{ fontSize: '12px', color: '#000' }}>
                  {descriptionsData.map((insp) => (
                    <div key={insp.id} style={{ marginBottom: '12px', borderBottom: '1px solid #ddd', paddingBottom: '8px' }}>
                      <div style={{ fontWeight: 900, fontSize: '13px', marginBottom: '4px' }}>
                        {insp.code} — Posto {insp.port}
                      </div>
                      {insp.plate_description && insp.plate_description.trim() && (
                        <div style={{ marginBottom: '2px' }}>
                          <strong>Placa:</strong> {insp.plate_description}
                        </div>
                      )}
                      {insp.floor_paint_description && insp.floor_paint_description.trim() && (
                        <div>
                          <strong>Pintura do Piso:</strong> {insp.floor_paint_description}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <SignatureFooter />
              </div>
            )}
          </>
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
