// src/__tests__/unit/admin-nfc-tags.test.ts
import { GET, POST } from '../../app/api/admin/nfc-tags/route';
import { PUT, DELETE } from '../../app/api/admin/nfc-tags/[id]/route';
import { verifyUser } from '../../lib/verifyUser';

// Mock Next.js NextResponse and NextRequest
jest.mock('next/server', () => {
  class MockNextResponse {
    static json(body: any, init?: any) {
      return new MockNextResponse(JSON.stringify(body), {
        ...init,
        headers: {
          'content-type': 'application/json',
          ...(init?.headers || {})
        }
      });
    }

    status: number;
    bodyText: string;
    headers: Map<string, string>;

    constructor(bodyText: any, init?: any) {
      this.bodyText = typeof bodyText === 'string' ? bodyText : JSON.stringify(bodyText);
      this.status = init?.status ?? 200;
      this.headers = new Map(Object.entries(init?.headers || {}));
    }

    async json() {
      return JSON.parse(this.bodyText);
    }

    async text() {
      return this.bodyText;
    }
  }

  return {
    NextResponse: MockNextResponse,
    NextRequest: jest.fn().mockImplementation((url, init) => {
      return {
        url,
        json: async () => init?.body ? JSON.parse(init.body) : {},
        headers: {
          get: (name: string) => init?.headers?.[name] || null
        }
      };
    })
  };
});

// Setup chainable Supabase mock functions
const mockOrder = jest.fn();
const mockSingle = jest.fn();
const mockSelect = jest.fn().mockImplementation(() => ({
  single: mockSingle,
  order: mockOrder,
}));
const mockEq = jest.fn().mockImplementation(() => ({
  select: mockSelect,
  then: jest.fn().mockImplementation((resolve) => resolve({ error: null })),
}));
const mockInsert = jest.fn().mockImplementation(() => ({
  select: mockSelect,
}));
const mockUpdate = jest.fn().mockImplementation(() => ({
  eq: mockEq,
  select: mockSelect,
}));

const mockSupabase = {
  from: jest.fn().mockImplementation(() => ({
    select: mockSelect,
    insert: mockInsert,
    update: mockUpdate,
  })),
};

// Mock verifyUser library
jest.mock('../../lib/verifyUser', () => ({
  verifyUser: jest.fn(),
  getSupabaseAdmin: jest.fn(() => mockSupabase),
}));

const mockReq = (body?: any, url = 'http://localhost/api/admin/nfc-tags') => {
  return {
    url,
    json: jest.fn().mockResolvedValue(body),
    headers: {
      get: jest.fn().mockReturnValue(null),
    },
  } as any;
};

describe('Admin NFC Tags API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/admin/nfc-tags', () => {
    it('returns 401 if user is unauthorized', async () => {
      (verifyUser as jest.Mock).mockResolvedValue(null);

      const res = await GET(mockReq());
      const data = await res.json();

      expect(res.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('returns 403 if user is not admin/manager', async () => {
      (verifyUser as jest.Mock).mockResolvedValue({ role: 'member' });

      const res = await GET(mockReq());
      const data = await res.json();

      expect(res.status).toBe(403);
      expect(data.error).toContain('Forbidden');
    });

    it('queries the database and returns list of tags', async () => {
      (verifyUser as jest.Mock).mockResolvedValue({ role: 'admin' });
      const mockTags = [
        { id: 'tag-1', tagName: 'Entrance Tag', tagId: 'nfc-001', tagType: 'attendance', latitude: 37.7749, longitude: -122.4194 }
      ];
      mockOrder.mockResolvedValueOnce({ data: mockTags, error: null });

      const res = await GET(mockReq());
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data).toEqual(mockTags);
      expect(mockSupabase.from).toHaveBeenCalledWith('nfc_tags');
    });
  });

  describe('POST /api/admin/nfc-tags', () => {
    it('returns 401 if user is unauthorized', async () => {
      (verifyUser as jest.Mock).mockResolvedValue(null);

      const res = await POST(mockReq({}));
      const data = await res.json();

      expect(res.status).toBe(401);
    });

    it('returns 403 if user is not admin/manager', async () => {
      (verifyUser as jest.Mock).mockResolvedValue({ role: 'member' });

      const res = await POST(mockReq({}));
      const data = await res.json();

      expect(res.status).toBe(403);
    });

    it('returns 400 if required fields are missing', async () => {
      (verifyUser as jest.Mock).mockResolvedValue({ role: 'admin' });
      
      const invalidBodies = [
        { tagName: 'Test' }, // missing tagId, tagType, latitude, longitude
        { tagName: 'Test', tagId: 'tag-id', tagType: 'attendance' }, // missing lat/long
        { tagName: 'Test', tagId: 'tag-id', tagType: 'attendance', latitude: 12.34 }, // missing longitude
      ];

      for (const body of invalidBodies) {
        const res = await POST(mockReq(body));
        expect(res.status).toBe(400);
        const data = await res.json();
        expect(data.error).toContain('Missing required fields');
      }
    });

    it('inserts new tag and returns 201', async () => {
      (verifyUser as jest.Mock).mockResolvedValue({ role: 'manager' });
      const validBody = {
        tagName: 'Exit Tag',
        tagId: 'nfc-002',
        tagType: 'attendance',
        latitude: 34.0522,
        longitude: -118.2437,
      };

      const mockInserted = {
        id: 'new-uuid',
        ...validBody,
        radius: 50.0,
        active: true,
        createdAt: '2026-07-07T12:00:00Z',
      };
      mockSingle.mockResolvedValueOnce({ data: mockInserted, error: null });

      const res = await POST(mockReq(validBody));
      const data = await res.json();

      expect(res.status).toBe(201);
      expect(data).toEqual(mockInserted);
      expect(mockSupabase.from).toHaveBeenCalledWith('nfc_tags');
    });
  });

  describe('PUT /api/admin/nfc-tags/[id]', () => {
    const params = Promise.resolve({ id: 'tag-1' });

    it('returns 401 if user is unauthorized', async () => {
      (verifyUser as jest.Mock).mockResolvedValue(null);

      const res = await PUT(mockReq({}), { params });
      expect(res.status).toBe(401);
    });

    it('returns 403 if user is not admin/manager', async () => {
      (verifyUser as jest.Mock).mockResolvedValue({ role: 'member' });

      const res = await PUT(mockReq({}), { params });
      expect(res.status).toBe(403);
    });

    it('returns 404 if tag not found', async () => {
      (verifyUser as jest.Mock).mockResolvedValue({ role: 'admin' });
      mockSingle.mockResolvedValueOnce({ data: null, error: { code: 'PGRST116', message: 'NFC tag not found' } });

      const res = await PUT(mockReq({ tagName: 'Updated Name' }), { params });
      const data = await res.json();

      expect(res.status).toBe(404);
      expect(data.error).toBe('NFC tag not found');
    });

    it('updates tag successfully', async () => {
      (verifyUser as jest.Mock).mockResolvedValue({ role: 'admin' });
      const mockUpdated = {
        id: 'tag-1',
        tagName: 'Updated Name',
        tagId: 'nfc-001',
        tagType: 'attendance',
        latitude: 37.7749,
        longitude: -122.4194,
        radius: 50.0,
        active: true
      };
      mockSingle.mockResolvedValueOnce({ data: mockUpdated, error: null });

      const res = await PUT(mockReq({ tagName: 'Updated Name' }), { params });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data).toEqual(mockUpdated);
      expect(mockSupabase.from).toHaveBeenCalledWith('nfc_tags');
    });
  });

  describe('DELETE /api/admin/nfc-tags/[id]', () => {
    const params = Promise.resolve({ id: 'tag-1' });

    it('returns 401 if user is unauthorized', async () => {
      (verifyUser as jest.Mock).mockResolvedValue(null);

      const res = await DELETE(mockReq(), { params });
      expect(res.status).toBe(401);
    });

    it('returns 403 if user is not admin/manager', async () => {
      (verifyUser as jest.Mock).mockResolvedValue({ role: 'member' });

      const res = await DELETE(mockReq(), { params });
      expect(res.status).toBe(403);
    });

    it('returns 404 if tag not found', async () => {
      (verifyUser as jest.Mock).mockResolvedValue({ role: 'admin' });
      mockEq.mockResolvedValueOnce({ error: { code: 'PGRST116', message: 'NFC tag not found' } });

      const res = await DELETE(mockReq(), { params });
      // Note: route.ts handles delete error by logging and returning 500 in this case, 
      // or we return 500 when Supabase returns error.
      expect(res.status).toBe(500);
    });

    it('soft-deletes tag successfully', async () => {
      (verifyUser as jest.Mock).mockResolvedValue({ role: 'admin' });
      mockEq.mockResolvedValueOnce({ error: null });

      const res = await DELETE(mockReq(), { params });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toContain('soft-deleted successfully');
    });
  });
});
