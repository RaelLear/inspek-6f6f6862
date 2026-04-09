import { useState, useEffect } from 'react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  onConfirm: () => void;
  delaySeconds?: number;
  confirmLabel?: string;
  destructive?: boolean;
  children?: React.ReactNode;
}

const DelayedConfirmDialog = ({
  open, onOpenChange, title, description, onConfirm,
  delaySeconds = 2, confirmLabel = 'Confirmar', destructive = false, children
}: Props) => {
  const [countdown, setCountdown] = useState(delaySeconds);

  useEffect(() => {
    if (!open) { setCountdown(delaySeconds); return; }
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [open, countdown, delaySeconds]);

  useEffect(() => {
    if (!open) setCountdown(delaySeconds);
  }, [open, delaySeconds]);

  const ready = countdown <= 0;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        {children}
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={!ready}
            className={destructive && ready ? 'bg-destructive hover:bg-destructive/90 text-destructive-foreground' : ''}
          >
            {ready ? confirmLabel : `Aguarde ${countdown}s`}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DelayedConfirmDialog;
