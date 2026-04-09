import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import Numpad from './Numpad';
import { Extinguisher, getTodayFormatted, formatDateInput, formatMonthYearInput, formatYearInput, monthYearToFullDate, yearToFullDate, daysUntil, displayWarranty, displayThirdLevel } from '@/lib/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Check, X, ArrowLeft, Ban, RefreshCw } from 'lucide-react';

interface InspectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  extinguishers: Extinguisher[];
  onComplete: () => void;
}

type Step = 'code' | 'port' | 'conformity' | 'dates';

interface ConformityState {
  manometer: 'Conforme' | 'Não Conforme' | null;
  seal: 'Conforme' | 'Não Conforme' | null;
  plate: 'Conforme' | 'Não Conforme' | null;
  floorPaint: 'Conforme' | 'Não Conforme' | null;
}

const InspectionDialog = ({ open, onOpenChange, extinguishers, onComplete }: InspectionDialogProps) => {
  const [step, setStep] = useState<Step>('code');
  const [code, setCode] = useState('');
  const [port, setPort] = useState('');
  const [inspectionDate, setInspectionDate] = useState(getTodayFormatted().replace(/\D/g, ''));
  const [warrantyExpiry, setWarrantyExpiry] = useState('');
  const [thirdLevel, setThirdLevel] = useState('');
  const [conformity, setConformity] = useState<ConformityState>({
    manometer: null, seal: null, plate: null, floorPaint: null,
  });
  const [manometerReviewDate, setManometerReviewDate] = useState('');
  const [sealReviewDate, setSealReviewDate] = useState('');
  const [plateDesc, setPlateDesc] = useState('');
  const [floorPaintDesc, setFloorPaintDesc] = useState('');
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [dateEditField, setDateEditField] = useState<string | null>(null);
  const [dateEditValue, setDateEditValue] = useState('');
  const [isObstructed, setIsObstructed] = useState(false);
  const [isReserve, setIsReserve] = useState(false);

  const reset = () => {
    setStep('code');
    setCode('');
    setPort('');
    setInspectionDate(getTodayFormatted().replace(/\D/g, ''));
    setWarrantyExpiry('');
    setThirdLevel('');
    setConformity({ manometer: null, seal: null, plate: null, floorPaint: null });
    setManometerReviewDate('');
    setSealReviewDate('');
    setPlateDesc('');
    setFloorPaintDesc('');
    setDateEditField(null);
    setDateEditValue('');
    setIsObstructed(false);
    setIsReserve(false);
  };

  const handleAttemptClose = () => {
    setShowCloseConfirm(true);
  };

  const handleConfirmClose = () => {
    setShowCloseConfirm(false);
    reset();
    onOpenChange(false);
  };

  const handleBack = () => {
    if (step === 'port') setStep('code');
    else if (step === 'conformity') setStep('port');
    else if (step === 'dates') setStep('conformity');
  };

  const handleCodeConfirm = () => {
    if (!code) return;
    setStep('port');
  };

  const handlePortConfirm = () => {
    if (!port) return;
    const existing = extinguishers.find((e) => e.code === code);
    if (existing) {
      if (existing.warranty_expiry) {
        const parts = existing.warranty_expiry.split('/');
        if (parts.length === 3) setWarrantyExpiry(parts[1] + parts[2]);
      }
      if (existing.third_level) {
        const parts = existing.third_level.split('/');
        if (parts.length === 3) setThirdLevel(parts[2]);
      }
    }
    setStep('conformity');
  };

  const handleConformityNext = () => {
    if (!isObstructed && !isReserve && (!conformity.manometer || !conformity.seal || !conformity.plate || !conformity.floorPaint)) {
      toast.error('Preencha todos os campos de conformidade.');
      return;
    }
    if (isObstructed) {
      handleSubmitSpecialStatus('Obstruído');
      return;
    }
    if (isReserve) {
      handleSubmitSpecialStatus('Reserva');
      return;
    }
    setStep('dates');
  };

  const formatDisplay = (raw: string) => formatDateInput(raw);

  const handleSubmitSpecialStatus = async (specialStatus: string) => {
    setSubmitting(true);
    try {
      let existing = extinguishers.find((e) => e.code === code);
      const formattedDate = formatDisplay(inspectionDate);

      const existingOnPort = extinguishers.find((e) => e.port === port && e.code !== code);
      if (existingOnPort) {
        await supabase.from('extinguishers').update({ status: 'Vazio', port: '' }).eq('id', existingOnPort.id);
      }

      if (!existing) {
        const { data, error } = await supabase.from('extinguishers').insert({
          code, port, status: specialStatus,
        }).select().single();
        if (error) throw error;
        existing = data as Extinguisher;
      } else {
        const { error } = await supabase.from('extinguishers').update({
          port, status: specialStatus,
        }).eq('id', existing.id);
        if (error) throw error;
      }

      const { error: inspError } = await supabase.from('inspections').insert({
        extinguisher_id: existing!.id,
        code, port,
        inspection_date: formattedDate,
        manometer_status: 'Conforme',
        seal_status: 'Conforme',
        plate_status: 'Conforme',
        floor_paint_status: 'Conforme',
      });
      if (inspError) throw inspError;

      toast.success(`Inspeção registrada (${specialStatus})!`);
      reset();
      onComplete();
      onOpenChange(false);
    } catch (err: any) {
      toast.error('Erro ao salvar inspeção: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    if (!warrantyExpiry || !thirdLevel) {
      toast.error('Vencimento Garantia e 3º Nível são obrigatórios.');
      return;
    }

    setSubmitting(true);

    try {
      let existing = extinguishers.find((e) => e.code === code);
      const formattedDate = formatDisplay(inspectionDate);
      
      const warrantyFormatted = monthYearToFullDate(formatMonthYearInput(warrantyExpiry));
      const thirdDigits = thirdLevel.replace(/\D/g, '');
      const fullThirdYear = thirdDigits.length <= 2 && thirdDigits.length > 0 ? '20' + thirdDigits.padStart(2, '0') : thirdDigits.slice(0, 4);
      const thirdFormatted = '01/01/' + fullThirdYear;
      
      const formattedManometerReview = manometerReviewDate ? formatDisplay(manometerReviewDate) : null;
      const formattedSealReview = sealReviewDate ? formatDisplay(sealReviewDate) : null;

      const isInReview = conformity.manometer === 'Não Conforme' || conformity.seal === 'Não Conforme';
      const newStatus = isInReview ? 'Em Revisão' : 'Aprovado';
      const reviewSendDate = isInReview ? formattedDate : null;

      // Handle port conflicts: remove extinguisher from old port
      const existingOnPort = extinguishers.find((e) => e.port === port && e.code !== code);
      if (existingOnPort) {
        await supabase.from('extinguishers').update({ status: 'Vazio', port: '' }).eq('id', existingOnPort.id);
      }

      if (!existing) {
        const { data, error } = await supabase.from('extinguishers').insert({
          code,
          port: isInReview ? '' : port,
          status: newStatus,
          warranty_expiry: warrantyFormatted,
          third_level: thirdFormatted,
          review_send_date: reviewSendDate,
        }).select().single();
        if (error) throw error;
        existing = data as Extinguisher;
      } else {
        const updateData: any = {
          port: isInReview ? '' : port,
          status: isInReview ? 'Em Revisão' : 'Aprovado',
          warranty_expiry: warrantyFormatted,
          third_level: thirdFormatted,
          review_send_date: isInReview ? reviewSendDate : existing.review_send_date,
        };
        const { error } = await supabase.from('extinguishers').update(updateData).eq('id', existing.id);
        if (error) throw error;
      }

      const { error: inspError } = await supabase.from('inspections').insert({
        extinguisher_id: existing!.id,
        code,
        port,
        inspection_date: formattedDate,
        manometer_status: conformity.manometer!,
        seal_status: conformity.seal!,
        plate_status: conformity.plate!,
        floor_paint_status: conformity.floorPaint!,
        plate_description: plateDesc || null,
        floor_paint_description: floorPaintDesc || null,
        manometer_review_date: formattedManometerReview,
        seal_review_date: formattedSealReview,
        warranty_expiry: warrantyFormatted,
        third_level: thirdFormatted,
      });
      if (inspError) throw inspError;

      toast.success('Inspeção registrada com sucesso!');
      reset();
      onComplete();
      onOpenChange(false);
    } catch (err: any) {
      toast.error('Erro ao salvar inspeção: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const ConformityButton = ({
    label,
    value,
    onChange,
  }: {
    label: string;
    value: 'Conforme' | 'Não Conforme' | null;
    onChange: (v: 'Conforme' | 'Não Conforme') => void;
  }) => (
    <div className="space-y-2">
      <p className="text-sm font-bold">{label}</p>
      <div className="flex gap-2">
        <Button
          type="button"
          variant={value === 'Conforme' ? 'default' : 'outline'}
          className={`flex-1 h-11 gap-1 font-bold ${value === 'Conforme' ? 'bg-status-approved text-white hover:bg-status-approved/90' : ''}`}
          onClick={() => onChange('Conforme')}
          disabled={isObstructed || isReserve}
        >
          <Check className="h-4 w-4" /> Conforme
        </Button>
        <Button
          type="button"
          variant={value === 'Não Conforme' ? 'default' : 'outline'}
          className={`flex-1 h-11 gap-1 font-bold ${value === 'Não Conforme' ? 'bg-status-urgent text-white hover:bg-status-urgent/90' : ''}`}
          onClick={() => onChange('Não Conforme')}
          disabled={isObstructed || isReserve}
        >
          <X className="h-4 w-4" /> Não Conforme
        </Button>
      </div>
    </div>
  );

  const handleDateEditConfirm = () => {
    const formatted = dateEditValue;
    if (dateEditField === 'inspection') setInspectionDate(formatted);
    else if (dateEditField === 'warranty') setWarrantyExpiry(formatted);
    else if (dateEditField === 'third') setThirdLevel(formatted);
    else if (dateEditField === 'manometerReview') setManometerReviewDate(formatted);
    else if (dateEditField === 'sealReview') setSealReviewDate(formatted);
    setDateEditField(null);
    setDateEditValue('');
  };

  const getWarrantyDisplay = () => {
    if (!warrantyExpiry) return 'Não informado';
    return formatMonthYearInput(warrantyExpiry);
  };

  const getThirdLevelDisplay = () => {
    if (!thirdLevel) return 'Não informado';
    const digits = thirdLevel.replace(/\D/g, '');
    if (digits.length > 0 && digits.length <= 2) return '20' + digits.padStart(2, '0');
    return digits.slice(0, 4);
  };

  // Check if existing extinguisher dates are expired/soon for colored text
  const existing = extinguishers.find((e) => e.code === code);
  const warrantyDays = existing ? daysUntil(existing.warranty_expiry) : null;
  const thirdDays = existing ? daysUntil(existing.third_level) : null;

  const getDateColor = (days: number | null) => {
    if (days === null) return '';
    if (days <= 0) return 'text-status-urgent';
    if (days <= 30) return 'text-status-review';
    return '';
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => { if (!v) handleAttemptClose(); }}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto" onInteractOutside={(e) => { e.preventDefault(); handleAttemptClose(); }}>
          <DialogHeader>
            <div className="flex items-center gap-2">
              {step !== 'code' && (
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleBack}>
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              )}
              <DialogTitle className="text-xl font-black flex-1">
                {step === 'code' ? 'Código do Extintor' : step === 'port' ? 'Ponto' : step === 'conformity' ? 'Conformidade' : 'Datas'}
              </DialogTitle>
              {step === 'conformity' && !dateEditField && (
                <div className="flex gap-1">
                  <Button
                    variant={isObstructed ? 'default' : 'outline'}
                    size="sm"
                    className={`gap-1 text-xs ${isObstructed ? 'bg-status-urgent text-white hover:bg-status-urgent/90' : 'border-status-urgent text-status-urgent hover:bg-status-urgent/10'}`}
                    onClick={() => {
                      setIsObstructed(!isObstructed);
                      setIsReserve(false);
                      if (!isObstructed) {
                        setConformity({ manometer: null, seal: null, plate: null, floorPaint: null });
                      }
                    }}
                  >
                    <Ban className="h-3 w-3" /> Obstruído
                  </Button>
                  <Button
                    variant={isReserve ? 'default' : 'outline'}
                    size="sm"
                    className={`gap-1 text-xs ${isReserve ? 'bg-status-review text-white hover:bg-status-review/90' : 'border-status-review text-status-review hover:bg-status-review/10'}`}
                    onClick={() => {
                      setIsReserve(!isReserve);
                      setIsObstructed(false);
                      if (!isReserve) {
                        setConformity({ manometer: null, seal: null, plate: null, floorPaint: null });
                      }
                    }}
                  >
                    <RefreshCw className="h-3 w-3" /> Reserva
                  </Button>
                </div>
              )}
            </div>
          </DialogHeader>

          {step === 'code' && (
            <Numpad value={code} onChange={setCode} onConfirm={handleCodeConfirm} maxDigits={3} label="Digite o código (3 dígitos)" />
          )}

          {step === 'port' && (
            <Numpad value={port} onChange={setPort} onConfirm={handlePortConfirm} maxDigits={2} label="Digite o ponto (2 dígitos)" />
          )}

          {step === 'conformity' && !dateEditField && (
            <div className="space-y-4">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Extintor: {code} | Ponto: {port}</p>
              </div>

              {(isObstructed || isReserve) && (
                <div className={`rounded-lg border p-3 ${isObstructed ? 'border-status-urgent/30 bg-status-urgent/5' : 'border-status-review/30 bg-status-review/5'}`}>
                  <p className={`text-sm font-bold ${isObstructed ? 'text-status-urgent' : 'text-status-review'}`}>
                    ⚠ Extintor marcado como {isObstructed ? 'obstruído' : 'reserva'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Não é necessário preencher conformidade nem datas.</p>
                </div>
              )}

              <ConformityButton
                label="Manômetro"
                value={conformity.manometer}
                onChange={(v) => {
                  setConformity({ ...conformity, manometer: v });
                  if (v === 'Não Conforme') {
                    setManometerReviewDate(getTodayFormatted().replace(/\D/g, ''));
                  } else {
                    setManometerReviewDate('');
                  }
                }}
              />
              {conformity.manometer === 'Não Conforme' && !isObstructed && (
                <div className="cursor-pointer rounded-lg border border-status-urgent/30 p-3 hover:bg-muted/50" onClick={() => { setDateEditField('manometerReview'); setDateEditValue(manometerReviewDate); }}>
                  <p className="text-xs text-status-urgent">Data de envio para revisão (Manômetro)</p>
                  <p className="text-lg font-bold">{manometerReviewDate ? formatDisplay(manometerReviewDate) : 'Toque para editar'}</p>
                </div>
              )}

              <ConformityButton
                label="Lacre"
                value={conformity.seal}
                onChange={(v) => {
                  setConformity({ ...conformity, seal: v });
                  if (v === 'Não Conforme') {
                    setSealReviewDate(getTodayFormatted().replace(/\D/g, ''));
                  } else {
                    setSealReviewDate('');
                  }
                }}
              />
              {conformity.seal === 'Não Conforme' && !isObstructed && (
                <div className="cursor-pointer rounded-lg border border-status-urgent/30 p-3 hover:bg-muted/50" onClick={() => { setDateEditField('sealReview'); setDateEditValue(sealReviewDate); }}>
                  <p className="text-xs text-status-urgent">Data de envio para revisão (Lacre)</p>
                  <p className="text-lg font-bold">{sealReviewDate ? formatDisplay(sealReviewDate) : 'Toque para editar'}</p>
                </div>
              )}

              <ConformityButton
                label="Placa"
                value={conformity.plate}
                onChange={(v) => setConformity({ ...conformity, plate: v })}
              />
              {conformity.plate === 'Não Conforme' && !isObstructed && (
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Descrição (opcional)</p>
                  <textarea
                    className="w-full mt-1 rounded border bg-background p-2 text-sm"
                    placeholder="Detalhes sobre a placa..."
                    value={plateDesc}
                    onChange={(e) => setPlateDesc(e.target.value)}
                    rows={2}
                  />
                </div>
              )}

              <ConformityButton
                label="Pintura do Piso"
                value={conformity.floorPaint}
                onChange={(v) => setConformity({ ...conformity, floorPaint: v })}
              />
              {conformity.floorPaint === 'Não Conforme' && !isObstructed && (
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Descrição (opcional)</p>
                  <textarea
                    className="w-full mt-1 rounded border bg-background p-2 text-sm"
                    placeholder="Detalhes sobre a pintura do piso..."
                    value={floorPaintDesc}
                    onChange={(e) => setFloorPaintDesc(e.target.value)}
                    rows={2}
                  />
                </div>
              )}

              <Button className="w-full h-12 text-lg font-bold" onClick={handleConformityNext} disabled={submitting}>
                {isObstructed ? (submitting ? 'Salvando...' : 'Registrar como Obstruído') : isReserve ? (submitting ? 'Salvando...' : 'Registrar como Reserva') : 'Próximo →'}
              </Button>
            </div>
          )}

          {step === 'conformity' && dateEditField && (
            <div>
              <Button variant="ghost" className="mb-2" onClick={() => setDateEditField(null)}>
                ← Voltar
              </Button>
              <Numpad
                value={dateEditValue}
                onChange={setDateEditValue}
                onConfirm={handleDateEditConfirm}
                maxDigits={8}
                isDate
                label="Digite a data (DD/MM/AAAA)"
              />
            </div>
          )}

          {step === 'dates' && !dateEditField && (
            <div className="space-y-4">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Extintor: {code} | Ponto: {port}</p>
              </div>

              <div className="cursor-pointer rounded-lg p-3 bg-foreground text-background hover:bg-foreground/90" onClick={() => { setDateEditField('inspection'); setDateEditValue(inspectionDate); }}>
                <p className="text-xs opacity-70">Data da Inspeção</p>
                <p className="text-lg font-bold">{formatDisplay(inspectionDate)}</p>
              </div>

              <div className="cursor-pointer rounded-lg border p-3 hover:bg-muted/50" onClick={() => { setDateEditField('warranty'); setDateEditValue(warrantyExpiry); }}>
                <p className="text-xs text-muted-foreground">Vencimento Garantia *</p>
                <p className={`text-lg font-bold ${getDateColor(warrantyDays)}`}>
                  {getWarrantyDisplay()}
                </p>
              </div>

              <div className="cursor-pointer rounded-lg border p-3 hover:bg-muted/50" onClick={() => { setDateEditField('third'); setDateEditValue(thirdLevel); }}>
                <p className="text-xs text-muted-foreground">3º Nível *</p>
                <p className={`text-lg font-bold ${getDateColor(thirdDays)}`}>
                  {getThirdLevelDisplay()}
                </p>
              </div>

              <Button className="w-full h-12 text-lg font-bold" onClick={handleSubmit} disabled={submitting}>
                {submitting ? 'Salvando...' : 'Registrar Inspeção'}
              </Button>
            </div>
          )}

          {step === 'dates' && dateEditField && (
            <div>
              <Button variant="ghost" className="mb-2" onClick={() => setDateEditField(null)}>
                ← Voltar
              </Button>
              {dateEditField === 'warranty' ? (
                <Numpad
                  value={dateEditValue}
                  onChange={setDateEditValue}
                  onConfirm={handleDateEditConfirm}
                  maxDigits={6}
                  isMonthYear
                  label="Mês / Ano (MM/AAAA)"
                />
              ) : dateEditField === 'third' ? (
                <Numpad
                  value={dateEditValue}
                  onChange={setDateEditValue}
                  onConfirm={handleDateEditConfirm}
                  maxDigits={4}
                  isYearOnly
                  label="Ano (AAAA)"
                />
              ) : (
                <Numpad
                  value={dateEditValue}
                  onChange={setDateEditValue}
                  onConfirm={handleDateEditConfirm}
                  maxDigits={8}
                  isDate
                  label="Digite a data (DD/MM/AAAA)"
                />
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Close confirmation */}
      <AlertDialog open={showCloseConfirm} onOpenChange={setShowCloseConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Fechar inspeção?</AlertDialogTitle>
            <AlertDialogDescription>Os dados não salvos serão perdidos.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-col gap-2 sm:flex-col">
            <AlertDialogAction onClick={handleConfirmClose} className="bg-background text-foreground border border-border hover:bg-muted">Fechar</AlertDialogAction>
            <AlertDialogCancel className="bg-foreground text-background hover:bg-foreground/90 border-none">Cancelar</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default InspectionDialog;
