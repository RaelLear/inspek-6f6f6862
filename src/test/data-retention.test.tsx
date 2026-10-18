import { render, screen, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import EmergencyContacts from '@/pages/EmergencyContacts';

const { records } = vi.hoisted(() => ({
  records: [
    { id: 'old-record', file_name: 'registro-antigo.xlsx', created_at: '2020-01-01T00:00:00Z', expires_at: '2020-01-08T00:00:00Z' },
    { id: 'new-record', file_name: 'registro-permanente.xlsx', created_at: '2026-10-18T00:00:00Z', expires_at: 'infinity' },
  ],
}));

vi.mock('react-router-dom', () => ({ useNavigate: () => vi.fn() }));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: { id: 'owner' } }) }));
vi.mock('@/contexts/WorkspaceContext', () => ({ useWorkspace: () => ({ currentTeamId: null }) }));
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: () => ({
      select: () => ({
        order: () => ({
          is: async () => ({ data: records }),
          eq: async () => ({ data: records }),
        }),
      }),
    }),
  },
}));

afterEach(cleanup);

describe('permanent spreadsheet retention', () => {
  it('keeps old records accessible regardless of their legacy expiration date', async () => {
    render(<EmergencyContacts />);
    expect(await screen.findByText(records[0].file_name)).toBeInTheDocument();
  });

  it('keeps new records with no finite expiration accessible', async () => {
    render(<EmergencyContacts />);
    expect(await screen.findByText(records[1].file_name)).toBeInTheDocument();
  });
});