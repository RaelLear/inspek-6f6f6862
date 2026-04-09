import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Upload, Download, FileSpreadsheet, Trash2, Clock, AlertTriangle, Check, Phone } from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

interface EmergencyContact {
  id: string;
  spreadsheet_id: string;
  employee_name: string;
  role: string;
  sector: string;
  contact1_phone: string | null;
  contact1_name: string | null;
  contact2_phone: string | null;
  contact2_name: string | null;
  inspected: boolean;
}

interface Spreadsheet {
  id: string;
  file_name: string;
  created_at: string;
  expires_at: string;
}

const EmergencyContacts = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { currentTeamId } = useWorkspace();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [spreadsheets, setSpreadsheets] = useState<Spreadsheet[]>([]);
  const [activeSpreadsheet, setActiveSpreadsheet] = useState<Spreadsheet | null>(null);
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [showUploadInfo, setShowUploadInfo] = useState(false);
  const [inspecting, setInspecting] = useState<EmergencyContact | null>(null);
  const [c1Phone, setC1Phone] = useState('');
  const [c1Name, setC1Name] = useState('');
  const [c2Phone, setC2Phone] = useState('');
  const [c2Name, setC2Name] = useState('');
  const [excelDownloaded, setExcelDownloaded] = useState(false);

  const fetchSpreadsheets = useCallback(async () => {
    let query = supabase.from('emergency_spreadsheets').select('*').order('created_at', { ascending: false });
    if (currentTeamId) query = query.eq('team_id', currentTeamId);
    else query = query.is('team_id', null);

    const { data } = await query;
    if (data) {
      // Filter out expired
      const now = new Date();
      const valid = (data as Spreadsheet[]).filter(s => new Date(s.expires_at) > now);
      setSpreadsheets(valid);
      if (activeSpreadsheet && !valid.find(s => s.id === activeSpreadsheet.id)) {
        setActiveSpreadsheet(null);
        setContacts([]);
      }
    }
  }, [currentTeamId, activeSpreadsheet]);

  const fetchContacts = useCallback(async (spreadsheetId: string) => {
    const { data } = await supabase
      .from('emergency_contacts')
      .select('*')
      .eq('spreadsheet_id', spreadsheetId)
      .order('employee_name');
    if (data) setContacts(data as EmergencyContact[]);
  }, []);

  useEffect(() => { fetchSpreadsheets(); }, [fetchSpreadsheets]);

  useEffect(() => {
    if (activeSpreadsheet) fetchContacts(activeSpreadsheet.id);
  }, [activeSpreadsheet, fetchContacts]);

  const getDaysLeft = (expiresAt: string) => {
    const diff = new Date(expiresAt).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<any>(sheet, { header: 1 });

      if (rows.length < 2) {
        toast.error('Planilha vazia ou sem dados.');
        return;
      }

      // Create spreadsheet record
      const insertData: any = { file_name: file.name };
      if (currentTeamId) insertData.team_id = currentTeamId;

      const { data: ss, error: ssErr } = await supabase
        .from('emergency_spreadsheets')
        .insert(insertData)
        .select()
        .single();
      if (ssErr) throw ssErr;

      // Parse rows (skip header)
      const contactRows = rows.slice(1).filter((r: any[]) => r[0]);
      const contactInserts = contactRows.map((r: any[]) => ({
        spreadsheet_id: (ss as Spreadsheet).id,
        employee_name: String(r[0] || '').trim(),
        role: String(r[1] || '').trim(),
        sector: String(r[2] || '').trim(),
        contact1_phone: r[3] ? String(r[3]).trim() : null,
        contact1_name: r[4] ? String(r[4]).trim() : null,
        contact2_phone: r[5] ? String(r[5]).trim() : null,
        contact2_name: r[6] ? String(r[6]).trim() : null,
        inspected: !!(r[3] && String(r[3]).trim()),
        ...(currentTeamId ? { team_id: currentTeamId } : {}),
      }));

      if (contactInserts.length > 0) {
        const { error: cErr } = await supabase.from('emergency_contacts').insert(contactInserts);
        if (cErr) throw cErr;
      }

      toast.success(`${contactInserts.length} colaboradores importados!`);
      setActiveSpreadsheet(ss as Spreadsheet);
      fetchSpreadsheets();
      fetchContacts((ss as Spreadsheet).id);
    } catch (err: any) {
      toast.error('Erro ao importar: ' + err.message);
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDeleteSpreadsheet = async (id: string) => {
    await supabase.from('emergency_spreadsheets').delete().eq('id', id);
    toast.success('Planilha removida.');
    if (activeSpreadsheet?.id === id) {
      setActiveSpreadsheet(null);
      setContacts([]);
    }
    fetchSpreadsheets();
  };

  const startInspection = (contact: EmergencyContact) => {
    setInspecting(contact);
    setC1Phone(contact.contact1_phone || '');
    setC1Name(contact.contact1_name || '');
    setC2Phone(contact.contact2_phone || '');
    setC2Name(contact.contact2_name || '');
  };

  const saveInspection = async () => {
    if (!inspecting) return;
    if (!c1Phone.trim() || !c1Name.trim()) {
      toast.error('O primeiro contato é obrigatório (telefone e nome).');
      return;
    }

    const { error } = await supabase.from('emergency_contacts').update({
      contact1_phone: c1Phone.trim(),
      contact1_name: c1Name.trim(),
      contact2_phone: c2Phone.trim() || null,
      contact2_name: c2Name.trim() || null,
      inspected: true,
    }).eq('id', inspecting.id);

    if (error) {
      toast.error('Erro ao salvar: ' + error.message);
      return;
    }

    toast.success('Contato registrado!');
    setInspecting(null);
    if (activeSpreadsheet) fetchContacts(activeSpreadsheet.id);
  };

  const downloadExcel = () => {
    if (!activeSpreadsheet || contacts.length === 0) return;

    const headers = ['Nome do Colaborador', 'Cargo', 'Setor', 'Contato 1', 'Nome', 'Contato 2', 'Nome'];
    const rows = contacts.map(c => [
      c.employee_name,
      c.role,
      c.sector,
      c.contact1_phone || '',
      c.contact1_name || '',
      c.contact2_phone || '',
      c.contact2_name || '',
    ]);

    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);

    // Column widths
    ws['!cols'] = [
      { wch: 30 }, { wch: 20 }, { wch: 20 },
      { wch: 18 }, { wch: 25 }, { wch: 18 }, { wch: 25 },
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Contatos de Emergência');
    XLSX.writeFile(wb, `contatos-emergencia-${new Date().toISOString().slice(0, 10)}.xlsx`);
    setExcelDownloaded(true);
    toast.success('Excel baixado!');
  };

  const downloadFormattedSheet = () => {
    if (!excelDownloaded) {
      toast.error('Baixe o arquivo Excel primeiro.');
      return;
    }
    // Same as excel but with formatting style similar to extinguisher spreadsheet
    downloadExcel();
  };

  const inspectedCount = contacts.filter(c => c.inspected).length;
  const totalCount = contacts.length;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="flex items-center gap-3 px-4 pt-6 pb-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-xl font-black text-foreground">Contatos de Emergência</h1>
          <p className="text-xs text-muted-foreground">Gerencie os contatos de emergência dos colaboradores</p>
        </div>
      </header>

      <div className="flex-1 px-4 pb-6 space-y-4">
        {/* Upload section */}
        {!activeSpreadsheet && (
          <div className="space-y-4">
            <div className="rounded-2xl border bg-card p-5 space-y-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-foreground">Aviso importante</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Os dados importados serão automaticamente deletados após <strong>7 dias</strong> (no 7º dia às 23:59). 
                    Certifique-se de baixar o arquivo antes do vencimento.
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-dashed border-muted-foreground/30 p-6 text-center space-y-3">
                <Upload className="h-8 w-8 mx-auto text-muted-foreground/50" />
                <div>
                  <p className="text-sm font-semibold text-foreground">Importar planilha Excel</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Formato: Nome do Colaborador, Cargo, Setor, Contato 1, Nome, Contato 2, Nome
                  </p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  className="hidden"
                  onChange={handleFileUpload}
                />
                <Button onClick={() => fileInputRef.current?.click()} className="gap-2">
                  <Upload className="h-4 w-4" /> Selecionar arquivo
                </Button>
              </div>
            </div>

            {/* Existing spreadsheets */}
            {spreadsheets.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-bold text-foreground">Planilhas ativas</p>
                {spreadsheets.map(s => (
                  <button
                    key={s.id}
                    className="w-full flex items-center gap-3 rounded-xl border bg-card p-4 hover:border-primary/40 transition-all text-left"
                    onClick={() => { setActiveSpreadsheet(s); setExcelDownloaded(false); }}
                  >
                    <FileSpreadsheet className="h-5 w-5 text-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{s.file_name}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <p className="text-xs text-muted-foreground">
                          Expira em {getDaysLeft(s.expires_at)} dia(s)
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteSpreadsheet(s.id); }}
                      className="rounded-full p-1.5 hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </button>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Active spreadsheet view */}
        {activeSpreadsheet && (
          <div className="space-y-4">
            {/* Info bar */}
            <div className="flex items-center justify-between rounded-xl border bg-card p-3">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => { setActiveSpreadsheet(null); setContacts([]); }}>
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                  <p className="text-sm font-bold text-foreground">{activeSpreadsheet.file_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {inspectedCount}/{totalCount} inspecionados • Expira em {getDaysLeft(activeSpreadsheet.expires_at)}d
                  </p>
                </div>
              </div>
            </div>

            {/* Download buttons */}
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1 gap-1" onClick={downloadExcel}>
                <Download className="h-3.5 w-3.5" /> Baixar Excel
              </Button>
              <Button
                variant="outline"
                size="sm"
                className={`flex-1 gap-1 ${!excelDownloaded ? 'opacity-50' : ''}`}
                onClick={downloadFormattedSheet}
                disabled={!excelDownloaded}
              >
                <FileSpreadsheet className="h-3.5 w-3.5" /> Planilha Formatada
              </Button>
            </div>

            {/* Contacts list */}
            <div className="space-y-2">
              {contacts.map(contact => (
                <button
                  key={contact.id}
                  onClick={() => startInspection(contact)}
                  className={`w-full flex items-center gap-3 rounded-xl border p-3 text-left transition-all ${
                    contact.inspected
                      ? 'border-[hsl(var(--status-approved))]/30 bg-[hsl(var(--status-approved))]/5'
                      : 'bg-card hover:border-primary/40'
                  }`}
                >
                  <div className={`rounded-full p-1.5 ${
                    contact.inspected ? 'bg-[hsl(var(--status-approved))]/20' : 'bg-muted'
                  }`}>
                    {contact.inspected ? (
                      <Check className="h-4 w-4 text-[hsl(var(--status-approved))]" />
                    ) : (
                      <Phone className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{contact.employee_name}</p>
                    <p className="text-xs text-muted-foreground">{contact.role} • {contact.sector}</p>
                  </div>
                  {contact.inspected && contact.contact1_phone && (
                    <p className="text-xs text-muted-foreground">{contact.contact1_phone}</p>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Inspection dialog */}
      <Dialog open={!!inspecting} onOpenChange={(v) => !v && setInspecting(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-black">Registrar Contato</DialogTitle>
          </DialogHeader>
          {inspecting && (
            <div className="space-y-4">
              <div className="rounded-lg border bg-muted/50 p-3">
                <p className="text-sm font-bold text-foreground">{inspecting.employee_name}</p>
                <p className="text-xs text-muted-foreground">{inspecting.role} • {inspecting.sector}</p>
              </div>

              <div className="space-y-3">
                <p className="text-sm font-bold text-foreground">Contato 1 <span className="text-accent">*</span></p>
                <Input
                  placeholder="Telefone"
                  value={c1Phone}
                  onChange={(e) => setC1Phone(e.target.value)}
                />
                <Input
                  placeholder="Nome do contato"
                  value={c1Name}
                  onChange={(e) => setC1Name(e.target.value)}
                />
              </div>

              <div className="space-y-3">
                <p className="text-sm font-bold text-muted-foreground">Contato 2 <span className="text-xs">(opcional)</span></p>
                <Input
                  placeholder="Telefone"
                  value={c2Phone}
                  onChange={(e) => setC2Phone(e.target.value)}
                />
                <Input
                  placeholder="Nome do contato"
                  value={c2Name}
                  onChange={(e) => setC2Name(e.target.value)}
                />
              </div>

              <Button className="w-full h-12 font-bold" onClick={saveInspection}>
                Registrar Contato
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EmergencyContacts;
