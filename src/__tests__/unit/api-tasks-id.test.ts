import { PUT } from '../../app/api/tasks/[id]/route';
import { supabase } from '../../lib/supabaseClient';
import { verifyUser } from '../../lib/verifyUser';

jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn().mockImplementation((body, init) => ({
      status: init?.status || 200,
      json: async () => body
    }))
  }
}));

jest.mock('../../lib/supabaseClient', () => ({
  supabase: {
    from: jest.fn()
  }
}));

jest.mock('../../lib/verifyUser', () => ({
  verifyUser: jest.fn(),
  getSupabaseAdmin: jest.fn().mockImplementation(() => require('../../lib/supabaseClient').supabase)
}));

const mockReq = (body: any, headers: Record<string, string> = {}) => ({
  json: jest.fn().mockResolvedValue(body),
  headers: {
    get: jest.fn().mockImplementation((name) => headers[name] || headers[name.toLowerCase()] || null)
  }
} as any as Request);

describe('PUT /api/tasks/[id]', () => {
  const mockUser = { uid: 'user-123', tenant_id: 'tenant-123' };
  
  beforeEach(() => {
    jest.clearAllMocks();
    (verifyUser as jest.Mock).mockResolvedValue(mockUser);
  });

  it('returns 200 OK if idempotency key already processed', async () => {
    const mockSelect = jest.fn().mockReturnThis();
    const mockEq = jest.fn().mockReturnThis();
    const mockMaybeSingle = jest.fn().mockResolvedValue({ data: { resolved_at: '2026-06-16T10:00:00Z' }, error: null });
    const mockSingle = jest.fn().mockResolvedValue({ data: { id: 'task-1', title: 'Task 1' }, error: null });

    (supabase.from as jest.Mock).mockImplementation((table: string) => {
      if (table === 'processed_mutations') {
        return { select: mockSelect, eq: mockEq, maybeSingle: mockMaybeSingle };
      }
      if (table === 'tasks') {
        return { select: mockSelect, eq: mockEq, single: mockSingle };
      }
    });

    const req = mockReq({ idempotency_key: 'idemp-1' });
    const res = await PUT(req, { params: Promise.resolve({ id: 'task-1' }) });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.status).toBe('already_processed');
    expect(data.task).toEqual({ id: 'task-1', title: 'Task 1' });
  });

  it('returns 200 OK for normal update (no conflict)', async () => {
    const mockSelect = jest.fn().mockReturnThis();
    const mockEq = jest.fn().mockReturnThis();
    const mockMaybeSingle = jest.fn().mockResolvedValue({ data: null, error: null }); 
    const mockSingle = jest.fn().mockResolvedValue({ 
      data: { id: 'task-2', updated_at: '2026-06-16T10:00:00Z', title: 'Old Title' }, 
      error: null 
    }); 

    const mockUpdate = jest.fn().mockReturnThis();
    const mockUpdateSingle = jest.fn().mockResolvedValue({
        data: { id: 'task-2', title: 'New Title' },
        error: null
    });
    const mockInsert = jest.fn().mockResolvedValue({ error: null });

    (supabase.from as jest.Mock).mockImplementation((table: string) => {
      if (table === 'processed_mutations') {
        return { select: mockSelect, eq: mockEq, maybeSingle: mockMaybeSingle, insert: mockInsert };
      }
      if (table === 'tasks') {
        return { select: mockSelect, eq: mockEq, single: mockSingle, update: mockUpdate };
      }
    });
    
    const mockUpdateChain = {
      eq: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      single: mockUpdateSingle
    };
    mockUpdate.mockReturnValue(mockUpdateChain);

    const req = mockReq({ 
      client_timestamp: '2026-06-16T10:00:00Z', 
      title: 'New Title'
    });
    const res = await PUT(req, { params: Promise.resolve({ id: 'task-2' }) });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
  });

  it('silently resolves conflict (server wins) if server updated_at is newer', async () => {
    const mockSelect = jest.fn().mockReturnThis();
    const mockEq = jest.fn().mockReturnThis();
    const mockMaybeSingle = jest.fn().mockResolvedValue({ data: null, error: null }); 
    const mockSingle = jest.fn().mockResolvedValue({ 
      data: { id: 'task-3', updated_at: '2026-06-16T11:00:00Z', title: 'Server Edited Title' }, 
      error: null 
    }); 

    const mockUpdate = jest.fn().mockReturnThis();
    const mockUpdateSingle = jest.fn().mockResolvedValue({
        data: { id: 'task-3', title: 'Server Edited Title' },
        error: null
    });

    (supabase.from as jest.Mock).mockImplementation((table: string) => {
      if (table === 'processed_mutations') return { select: mockSelect, eq: mockEq, maybeSingle: mockMaybeSingle };
      if (table === 'tasks') return { select: mockSelect, eq: mockEq, single: mockSingle, update: mockUpdate };
    });
    
    const mockUpdateChain = {
      eq: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      single: mockUpdateSingle
    };
    mockUpdate.mockReturnValue(mockUpdateChain);

    const req = mockReq({ 
      client_timestamp: '2026-06-16T10:00:00Z', 
      title: 'Client Title'
    });
    
    const res = await PUT(req, { params: Promise.resolve({ id: 'task-3' }) });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.updated_by_server).toBe(true);
    expect(data.task.title).toBe('Server Edited Title');
  });
});
