import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { FireExtinguisher, Phone, Settings, Eye, EyeOff, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ModuleConfig {
  id: string;
  label: string;
  route: string;
  visible: boolean;
  order: number;
}

const DEFAULT_MODULES: ModuleConfig[] = [
  { id: 'extintores', label: 'Extintor de Incêndio', route: '/extintores', visible: true, order: 0 },
  { id: 'contatos', label: 'Contatos de Emergência', route: '/contatos-emergencia', visible: true, order: 1 },
];

const CACHE_KEY = 'inspek-menu-modules';

const loadModules = (): ModuleConfig[] => {
  try {
    const saved = localStorage.getItem(CACHE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as ModuleConfig[];
      const ids = new Set(parsed.map(m => m.id));
      const merged = [...parsed];
      DEFAULT_MODULES.forEach(d => {
        if (!ids.has(d.id)) merged.push(d);
      });
      return merged.sort((a, b) => a.order - b.order);
    }
  } catch { /* ignore */ }
  return DEFAULT_MODULES;
};

const getIcon = (id: string) => {
  switch (id) {
    case 'extintores': return <FireExtinguisher className="h-10 w-10" />;
    case 'contatos': return <Phone className="h-10 w-10" />;
    default: return <FireExtinguisher className="h-10 w-10" />;
  }
};

const MainMenu = () => {
  const navigate = useNavigate();
  const [modules, setModules] = useState<ModuleConfig[]>(loadModules);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    localStorage.setItem(CACHE_KEY, JSON.stringify(modules));
  }, [modules]);

  const toggleVisibility = (id: string) => {
    setModules(prev => prev.map(m => m.id === id ? { ...m, visible: !m.visible } : m));
  };

  const moveModule = (from: number, to: number) => {
    if (to < 0 || to >= modules.length) return;
    const updated = [...modules];
    const [moved] = updated.splice(from, 1);
    updated.splice(to, 0, moved);
    setModules(updated.map((m, i) => ({ ...m, order: i })));
  };

  const visibleModules = modules.filter(m => m.visible);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="flex items-center justify-center gap-3 px-6 pt-8 pb-4">
        <img src="/logo-site.png" alt="inSpek" className="h-10 w-10 object-contain" />
        <h1 className="text-2xl font-black tracking-tight text-foreground">inSpek</h1>
      </header>

      <p className="text-center text-sm text-muted-foreground mb-8">
        Selecione o tipo de inspeção
      </p>

      {/* Module grid */}
      <div className="flex-1 px-6">
        <div className="mx-auto grid max-w-md grid-cols-2 gap-4">
          {(editing ? modules : visibleModules).map((mod, idx) => (
            <button
              key={mod.id}
              onClick={() => !editing && navigate(mod.route)}
              className={`group relative flex flex-col items-center justify-center gap-3 rounded-2xl border bg-card p-6 transition-all ${
                editing
                  ? mod.visible
                    ? 'border-primary/30 opacity-100'
                    : 'border-dashed border-muted-foreground/30 opacity-50'
                  : 'hover:border-primary/40 hover:shadow-md active:scale-[0.97]'
              }`}
              disabled={editing}
            >
              {editing && (
                <div className="absolute top-2 right-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleVisibility(mod.id); }}
                    className="rounded-full p-1 hover:bg-muted"
                  >
                    {mod.visible ? <Eye className="h-3.5 w-3.5 text-foreground" /> : <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />}
                  </button>
                </div>
              )}
              {editing && (
                <div className="absolute top-2 left-2 flex flex-col gap-0.5">
                  <button
                    onClick={(e) => { e.stopPropagation(); moveModule(idx, idx - 1); }}
                    className="rounded p-0.5 hover:bg-muted text-muted-foreground text-xs"
                    disabled={idx === 0}
                  >▲</button>
                  <button
                    onClick={(e) => { e.stopPropagation(); moveModule(idx, idx + 1); }}
                    className="rounded p-0.5 hover:bg-muted text-muted-foreground text-xs"
                    disabled={idx === modules.length - 1}
                  >▼</button>
                </div>
              )}
              <div className="text-foreground">
                {getIcon(mod.id)}
              </div>
              <span className="text-xs font-semibold text-muted-foreground text-center leading-tight">
                {mod.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Edit button */}
      <div className="flex justify-center py-6">
        <Button
          variant={editing ? 'default' : 'ghost'}
          size="sm"
          className={editing ? '' : 'text-muted-foreground/50 hover:text-muted-foreground text-xs'}
          onClick={() => setEditing(!editing)}
        >
          {editing ? (
            <><X className="h-3.5 w-3.5 mr-1" /> Concluir edição</>
          ) : (
            <><Settings className="h-3.5 w-3.5 mr-1" /> Editar menu</>
          )}
        </Button>
      </div>
    </div>
  );
};

export default MainMenu;
