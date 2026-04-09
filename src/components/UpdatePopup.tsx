import { useState, useEffect } from 'react';
import { APP_VERSION, CHANGELOG } from '@/lib/version';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';

const UpdatePopup = () => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const lastVersion = localStorage.getItem('inspek_version');
    if (lastVersion !== APP_VERSION) {
      setShow(true);
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem('inspek_version', APP_VERSION);
    setShow(false);
  };

  return (
    <Dialog open={show} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-xl font-black flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Nova Versão {APP_VERSION}
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Reinicie a página 1 a 2 vezes para garantir a atualização completa.
        </p>
        <div className="rounded-lg border bg-muted/30 p-3">
          <p className="text-xs font-bold text-muted-foreground mb-2">O que mudou:</p>
          <ul className="space-y-1">
            {CHANGELOG.map((item, i) => (
              <li key={i} className="text-sm flex items-start gap-2">
                <span className="text-foreground font-black mt-0.5">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
        <Button className="w-full font-bold" onClick={handleClose}>
          Entendi
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default UpdatePopup;
