import { Button } from '@/components/ui/button';
import { Delete, Check } from 'lucide-react';

interface NumpadProps {
  value: string;
  onChange: (value: string) => void;
  onConfirm: () => void;
  maxDigits?: number;
  label?: string;
  isDate?: boolean;
  isMonthYear?: boolean;
  isYearOnly?: boolean;
}

const Numpad = ({ value, onChange, onConfirm, maxDigits, label, isDate, isMonthYear, isYearOnly }: NumpadProps) => {
  const handleDigit = (digit: string) => {
    const raw = value.replace(/\D/g, '');
    const limit = maxDigits || (isYearOnly ? 4 : isMonthYear ? 6 : isDate ? 8 : undefined);
    if (limit && raw.length >= limit) return;
    onChange(raw + digit);
  };

  const handleBackspace = () => {
    const raw = value.replace(/\D/g, '');
    onChange(raw.slice(0, -1));
  };

  const displayValue = (() => {
    const digits = value.replace(/\D/g, '');
    if (isYearOnly) return digits || '';
    if (isMonthYear) {
      if (digits.length <= 2) return digits;
      return digits.slice(0, 2) + '/' + digits.slice(2);
    }
    if (isDate) {
      if (digits.length <= 2) return digits;
      if (digits.length <= 4) return digits.slice(0, 2) + '/' + digits.slice(2);
      return digits.slice(0, 2) + '/' + digits.slice(2, 4) + '/' + digits.slice(4);
    }
    return digits || '';
  })();

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-xs mx-auto">
      {label && <p className="text-sm font-medium text-muted-foreground">{label}</p>}
      <div className="w-full h-14 flex items-center justify-center rounded-lg border-2 border-foreground/20 bg-card text-2xl font-bold tracking-[0.3em] text-foreground">
        {displayValue || <span className="text-muted-foreground/40">---</span>}
      </div>

      <div className="grid grid-cols-3 gap-2 w-full">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
          <Button
            key={n}
            variant="outline"
            className="h-14 text-xl font-bold active:bg-foreground active:text-background"
            onClick={() => handleDigit(String(n))}
          >
            {n}
          </Button>
        ))}
        <div />
        <Button variant="outline" className="h-14 text-xl font-bold active:bg-foreground active:text-background" onClick={() => handleDigit('0')}>
          0
        </Button>
        <Button variant="outline" className="h-14 active:bg-foreground active:text-background" onClick={handleBackspace}>
          <Delete className="h-5 w-5" />
        </Button>
      </div>

      <Button className="w-full h-12 text-lg font-bold gap-2 bg-foreground text-background hover:bg-foreground/90" onClick={onConfirm}>
        <Check className="h-5 w-5" /> Confirmar
      </Button>
    </div>
  );
};

export default Numpad;
